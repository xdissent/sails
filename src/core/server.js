var util = require('util'),
  _ = require('lodash');

module.exports = function (config, http, router) {

  var usingSSL = config.server && config.server.key && config.server.cert,
    BaseServer = usingSSL ? require('https').Server : require('http').Server;

  function Server (options, listener) {
    var args = usingSSL ? [options, listener] : [listener];
    BaseServer.apply(this, args);
    this.listening = false;
  }

  util.inherits(Server, BaseServer);

  Server.createServer = function(options, listener) {
    if (_.isFunction(options)) {
      listener = options;
      options = {};
    }
    options = options || {};
    return new Server(options, listener);
  };

  var listen = Server.prototype.listen;

  Server.prototype.listen = function(port, host, backlog, callback) {
    this.listening = true;

    if (_.isFunction(port)) {
      callback = port;
      port = null;
    }

    if (port && !_.isNumber(port)) {
      return listen.apply(this, arguments);
    }

    if (_.isNumber(host)) {
      if (_.isFunction(backlog)) {
        callback = backlog;
      }
      backlog = host;
      host = null;
    } else if (_.isFunction(host)) {
      backlog = null;
      callback = host;
      host = null;
    }
    if (_.isFunction(backlog)) {
      callback = backlog;
      backlog = null;
    }
    port = port || config.server.port;
    host = host || config.server.host;
    callback = callback || function () {};
    return listen.call(this, port, host, backlog, callback);
  };

  Server.prototype.close = function (callback) {
    if (!this.listening) return (callback || function () {})();
    BaseServer.prototype.close.apply(this, arguments);
    this.listening = false;
  };

  return Server.createServer(config.server.options, http);
};
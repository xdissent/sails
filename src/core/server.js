var util = require('util'),
  _ = require('lodash');

module.exports = function (http, middleware, routes, hooks, config) {

  var usingSSL = config.server && config.server.key && config.server.cert,
    BaseServer = usingSSL ? require('https').Server : require('http').Server;

  function Server (options, listener) {
    middleware.build();
    routes.build();
    var args = usingSSL ? [options, listener] : [listener];
    BaseServer.apply(this, args);
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
    if (port && !_.isNumber(port)) return listen.apply(this, arguments);
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

  return Server.createServer(config.server.options, http);
};
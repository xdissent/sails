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

  Server.prototype.listen = function() {
    var args = [].slice.apply(arguments),
      callback = args.pop();

    if (!_.isFunction(callback)) {
      args.push(callback);
      callback = function (err) {
        if (err) throw err;
      };
    }

    if (this.listening) {
      return callback(new Error('Server already listening'));
    }
    this.listening = true;

    var self = this,
      runCallback = function (err) {
        self.removeListener('error', self._error);
        self.removeListener('listening', self._listening);
        self._error = null;
        self._listening = null;
        callback(err);
      };
    this._error = runCallback;
    this.on('error', this._error);
    this._listening = function () {
      runCallback();
    };
    this.on('listening', this._listening);

    if (args.length > 0 && !_.isNumber(args[0])) {
      return BaseServer.prototype.listen.apply(this, args);
    }

    if (args.length === 0) {
      args.push(config.server.port);
      args.push(config.server.host);
    } else if (args.length === 1) {
      args.push(config.server.host);
    } else if (args.length === 2) {
      if (!_.isString(args[1])) {
        args.splice(1, 0, config.server.host);
      }
    }

    return BaseServer.prototype.listen.apply(this, args);
  };

  Server.prototype.close = function (callback) {
    callback = callback || function (err) {
      if (err) throw err;
    };

    if (!this.listening) return callback(new Error('Server not listening'));
    this.listening = false;

    var self = this,
      runCallback = function (err) {
        self.removeListener('error', self._error);
        self.removeListener('close', self._close);
        self._error = null;
        self._close = null;
        callback(err);
      };
    this._error = runCallback;
    this.on('error', this._error);
    this._close = function () {
      runCallback();
    };
    this.on('close', this._close);

    BaseServer.prototype.close.call(this);
  };

  return Server.createServer(config.server.options, http);
};
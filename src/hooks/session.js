var express = require('express'),
  _ = require('lodash');

module.exports = function (config, middleware, cookies) {  

  function Session () {
    this.middleware = express.session(this.config());
    middleware.insertAfter(cookies, this.middleware);
  }

  Session.prototype.store = function() {
    if (this._store) return this._store;
    if (config.session.store) return this._store = config.session.store;
    switch (config.session.adapter) {
      case null:
        break;
      case 'memory':
        this._store = new (express.session.MemoryStore)();
        break;
      case 'redis':
        this._store = new(require('connect-redis')(express))(config.session);
        break;
      case 'mongo':
        this._store = new(require('connect-mongo')(express))(config.session);
        break;
    }
    return this._store;
  };

  Session.prototype.config = function() {
    return _.extend({}, config.session, {store: this.store()});
  };

  Session.prototype.get = function(sessionId, cb) {
    this.store().get(sessionId, cb);
  };

  Session.prototype.set = function(sessionId, data, cb) {
    this.store().get(sessionId, data, cb);
  };

  return new Session();
};
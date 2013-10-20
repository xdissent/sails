var _ = require('lodash');

module.exports = function (config, middleware, router, log, sockets) {

  log = log.namespace('pubsub');

  function PubSub () {
    middleware.insertBefore(router.middleware, this._middleware());
  }

  PubSub.prototype._middleware = function() {
    var self = this;
    return function pubsub (req, res, next) {
      if (!req.isSocket) return next();
      req.subscribe = function subscribe (room) {
        self.subscribe(req.socket, room);
      };
      req.unsubscribe = function unsubscribe (room) {
        self.unsubscribe(req.socket, room);
      };
      req.publish = function publish (room, message) {
        self.publish(req.socket, room, message);
      };
      req.broadcast = function broadcast (room, message) {
        self.broadcast(room, message);
      };
      next();
    };
  };

  PubSub.prototype.subscribe = function(socket, room) {
    this.validateSocket(socket)
    this.validateRoom(room);
    log.verbose('Subscribing socket to room', room);
    socket.join(room);
  };

  PubSub.prototype.unsubscribe = function(socket, room) {
    this.validateSocket(socket)
    this.validateRoom(room);
    log.verbose('Unsubscribing socket from room', room);
    socket.leave(room);
  };

  PubSub.prototype.publish = function(socket, room, message) {
    this.validateSocket(socket)
    this.validateRoom(room);
    log.verbose('Publishing to room', room, message);
    socket.broadcast.to(room).json.send(message);
  };

  PubSub.prototype.broadcast = function(room, message) {
    this.validateRoom(room);
    log.verbose('Broadcasting to room', room, message);
    sockets.sockets['in'](room).json.send(message);
  };

  PubSub.prototype.subscribers = function(room) {
    this.validateRoom(room);
    log.verbose('Fetching subscribed sockets for room', room);
    return sockets.sockets.clients(room);
  };

  PubSub.prototype.validateSocket = function(socket) {
    if (!socket || !socket.manager) throw new Error('Invalid socket');
  };

  PubSub.prototype.validateRoom = function(room) {
    if (_.isEmpty(room)) throw new Error('Invalid room');
  };

  return new PubSub();
};
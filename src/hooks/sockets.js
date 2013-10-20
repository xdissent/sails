var _ = require('lodash'),
  io = require('socket.io'),
  RedisStore = require('socket.io/lib/stores/redis'),
  redis = require('socket.io/node_modules/redis'),
  cookie = require('express/node_modules/cookie'),
  connect = require('express/node_modules/connect'),
  parseSignedCookie = connect.utils.parseSignedCookie,
  Session = connect.middleware.session.Session,
  BaseResponse = require('http').ServerResponse.prototype,
  BaseRequest = require('http').IncomingMessage.prototype;

module.exports = function (config, server, log, session, cookies, http) {
  var sockets = createServer();
  configureServer();
  return sockets;

  function createServer() {
    return io.listen(server, {logger: {info: function () {}}});
  }

  function configureServer () {
    // If logger option not set, use the default Sails logger config
    if (!config.sockets.logger) {
      var logLevels = {
        'silent': 0,
        'error': 1,
        'warn': 2,
        'debug': 4, // Socket.io flips these around (and it considers debug more `verbose` than `info`)
        'info': 3,  // Socket.io flips these around
        'verbose': 4  // Socket.io has no concept of `verbose`
      };
      sockets.set('log level', logLevels[config.log.level] || logLevels['info']);
      sockets.set('logger', {
        error: log.error,
        warn: log.warn,
        info: log.info,
        // socket.io considers `debug` the most verbose config, so we'll use verbose to represent it
        debug: log.verbose
      });
    }

    _.each(config.sockets, function (value, name) {
      if (name === 'authorization') return configureAuthorization(value);
      if (name === 'adapter') return configureAdapter(value);
      if (_.isUndefined(value)) return;
      sockets.set(name, value);
    });

    sockets.sockets.on('connection', defaultConnection);
    return sockets;
  }

  function configureAuthorization (value) {
    if (_.isFunction(value)) {
      sockets.set('authorization', value);
    } else if (value === true) {
      sockets.set('authorization', defaultAuthorization);
    } else {
      sockets.set('authorization', false);
    }
  }

  function configureAdapter (value) {
    if (value !== 'redis') return;
    var host = config.sockets.host || '127.0.0.1',
      port = config.sockets.port || 6379,
      store = {
        redisPub: createRedisConnection(port, host),
        redisSub: createRedisConnection(port, host),
        redisClient: createRedisConnection(port, host)
      };
    if (config.sockets.pass) store.redis = redis;
    sockets.set('store', new RedisStore(store));
  }

  function createRedisConnection(port, host) {
    var client = redis.createClient(port, host, config.sockets);
    if(config.sockets.pass) client.auth(config.sockets.pass);
    if (config.sockets.db) client.select(config.sockets.db);
    return client;
  }

  function defaultAuthorization (handshake, accept) {
    log.info('Socket is trying to connect');
    var secret = config.session.secret || config.cookies.secret;
    handshake.headers.cookie = handshake.query.cookie || handshake.headers.cookie;
    if (!handshake.headers.cookie) {
      return accept('No cookie transmitted with socket.io connection.', false);
    }
    handshake.cookie = cookie.parse(handshake.headers.cookie);
    handshake.sessionID = parseSignedCookie(handshake.cookie[config.session.key], secret);
    session.get(handshake.sessionID, function (err, session) {
      if (err || !session) return accept('Error loading session from socket.io.', false);
      handshake.session = new Session(handshake, session);
      log.info('Connected socket to existing session');
      accept(null, true);
    });
  }

  function defaultConnection (socket) {
    if (!socket.handshake || !socket.handshake.sessionID) {
      return log.error('No valid session for this socket');
    }
    socket.on('request', function (method, url, body, headers, callback) {

      var req = {
        method: method,
        ip: socket.handshake.address.address,
        port: socket.handshake.address.port,
        url: url,
        socket: socket,
        isSocket: true,
        body: body,
        headers: _.extend({cookie: socket.handshake.headers.cookie}, headers),
        __proto__: BaseRequest
      };

      var res = {
        end: function (body) {
          callback(res.statusCode, res._headers, body);
        },
        __proto__: BaseResponse
      };
      
      http(req, res);
    });
  }
};
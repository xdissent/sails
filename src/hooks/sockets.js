var io = require('socket.io'),
  RedisStore = require('socket.io/lib/stores/redis'),
  redis = require('socket.io/node_modules/redis'),
  _ = require('lodash'),
  cookie = require('express/node_modules/cookie'),
  connect = require('express/node_modules/connect'),
  parseSignedCookie = connect.utils.parseSignedCookie,
  Session = connect.middleware.session.Session;

module.exports = function (config, server, log, session, cookies) {
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
    if (value === 'memory') return;
    if (value === 'redis') return configureRedis();
  }

  function configureRedis () {
    var host = config.sockets.host || '127.0.0.1',
      port = config.sockets.port || 6379,
      store = {
        redisPub: createRedisConnection(port, host),
        redisSub: createRedisConnection(port, host),
        redisClient: createRedisConnection(port, host)
      };

    if (config.sockets.pass) {
      store.redis = redis;
    }

    sockets.set('store', new RedisStore(store));
  }

  function createRedisConnection(port, host) {
    // Create a new client using the port, host and other options
    var client = redis.createClient(port, host, config.sockets);

    // If a password is needed use client.auth to set it
    if(config.sockets.pass) {
      client.auth(config.sockets.pass, function(err) {
        if (err) throw err;
      });
    }

    // If a db is set select it on the client
    if (config.sockets.db) client.select(config.sockets.db);
    return client;
  }

  function defaultAuthorization (handshake, accept) {
    log.info('Socket is trying to connect');
    if (handshake.query.cookie) {
      handshake.headers.cookie = handshake.query.cookie;
    }
    if (!handshake.headers.cookie) {
      return accept('No cookie transmitted with socket.io connection.', false);
    }
    handshake.cookie = cookie.parse(handshake.headers.cookie);
    handshake.sessionID = parseSignedCookie(handshake.cookie[config.session.key], config.cookies.secret);
    session.get(handshake.sessionID, function (err, session) {
      if (err) return accept('Error loading session from socket.io.', false);
      if (!session) {
        handshake.session = new Session(handshake, {cookie: {httpOnly: true}});
        log.info('Generated new session for socket', handshake);
        return accept(null, true);
      }
      handshake.session = new Session(handshake, session);
      log.info('Connected socket to existing session', handshake);
      accept(null, true);
    });
  }

  function defaultConnection (socket) {
    if (!socket.handshake || !socket.handshake.sessionID) {
      return log.error('No valid session for this socket');
    }
    var sessionKey = socket.handshake.sessionID;
    session.get(sessionKey, function (err, session) {
      if (err) return;
      if (!_.isPlainObject(session)) session = {};
      log.info('GOT DAT SESS');
    })
  }
};
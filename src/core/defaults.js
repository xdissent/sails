module.exports = function (appPath) {

  // Set up config defaults
  return {

    // Default hooks
    hooks: [
      'grunt',
      'static',
      'adapters',
      'models',
      'sockets',
      'pubsub',
      'metadata',
      'bodyParser',
      'poweredBy',
      'methodOverride',
      'cookies',
      'session',
      'csrf',
      'cors',
      'i18n',
      'flash',
      'params',
      'qualifiers',
      'controllers',
      'blueprints',
      'views',
      'policies',
      'notFound',
      'error'
    ],

    poweredBy: 'Sails',

    notFound: {
      message: 'Not Found',
      handler: undefined
    },

    error: {
      handler: undefined
    },

    server: {
      port: 1337,
      host: 'localhost'
    },

    blueprints: {
      enabled: [
        'rest',
        'shortcuts',
        'actions'
      ],
      prefix: '',
      pluralize: false
    },

    // Controller config
    controllers: {

      // (Note: global controller.blueprints config may be overridden on a per-controller basis
      //      by setting the 'blueprint' property in a controller)
      blueprints: {

        // Whether routes are automatically generated for controller actions
        actions: true,

        // e.g. '/:controller/find/:id'
        shortcuts: true,

        // e.g. 'get /:controller/:id?': 'foo.find'
        rest: true,

        // Optional mount path prefix for blueprint routes
        // e.g. '/api/v2'
        prefix: '',

        // If a blueprint REST route catches a request,
        // only match an `id` if it's an integer
        expectIntegerId: false, 

        // Enable JSONP callbacks on REST blueprints
        jsonp: false,

        // Pluralize controller names in routes
        pluralize: false
      }
    },


    // View hook config
    views: {

      // Engine for views (can be ejs, haml, etc.)
      engine: 'ejs',

      // Layout is on by default, in the top level of the view directory
      // true === use default
      // false === don't use a layout
      // string === path to layout
      layout: true

    },

    // i18n
    i18n: {
      locales: ['en', 'es'],
      defaultLocale: 'en',
      updateFiles: false,
      extension: '.json',
      cookie: 'sails.locale'
    },


    // CSRF middleware protection, all non-GET requests must send '_csrf' parmeter
    // _csrf is a parameter for views, and is also available via GET at /csrfToken
    csrf: false,

    cors: {
      origin: '*',
      credentials: true,
      methods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      headers: 'content-type',
      allRoutes: false
    },

    watcher: {
      timeout: 250,
      maxTimeout: 1000
    },

    // File upload settings
    fileUpload: {
      maxMB: 10
    },

    // Name of application for layout title
    appName: 'Sails',

    // Paths for application modules and key files
    paths: {
      app:          appPath,
      config:       appPath + '/config',
      tmp:          appPath + '/.tmp',
      controllers:  appPath + '/api/controllers',
      models:       appPath + '/api/models',
      services:     appPath + '/api/services',
      policies:     appPath + '/api/policies',
      adapters:     appPath + '/api/adapters',
      hooks:        appPath + '/api/hooks',
      'public':     appPath + '/.tmp/public',
      templates:    appPath + '/assets/templates',
      dependencies: appPath + '/dependencies',
      views:        appPath + '/views',
      layout:       appPath + '/views/layout.ejs',
      locales:      appPath + '/config/locales',
      blueprints:   appPath + '/api/blueprints'
    },

    // Default model properties
    adapters: {
      'default': 'disk',
      memory: {
        module: 'sails-memory'
      },
      disk: {
        module: 'sails-disk'
      },
      mongo: {
        module    : 'sails-mongo',
        host    : 'localhost',
        user    : 'root'
      },
      mysql: {
        module    : 'sails-mysql',
        host    : 'localhost',
        user    : 'root'
      },
      postgresql: {
        module    : 'sails-postgresql',
        host    : 'localhost',
        user    : 'root'
      }
    },

    // HTTP cache configuration
    cache: {
      maxAge: 31557600000
    },

    cookies: {
      secret: 'keyboard cat'
    },

    flash: {
      unsafe: true
    },

    // Session store configuration
    session: {
      adapter: 'memory',
      key: "sails.sid"
    },

    // Logging config
    log: {
      level: 'info'
    },

    // Variables which will be made globally accessible
    globals: {
      _: true,
      async: true,
      sails: true,
      services: true,
      adapters: true,
      models: true
    },

    sockets: {

      // Setup adapter to use for socket.io MQ (pubsub) store
      // (`undefined` indicates default memory store)
      // NOTE: Default memory store will not work for clustered deployments with multiple instances.
      adapter: undefined,
      
      // A array of allowed transport methods which the clients will try to use.
      // The flashsocket transport is disabled by default
      // You can enable flashsockets by adding 'flashsocket' to this list:
      transports: [
        'websocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling'
      ],

      // Match string representing the origins that are allowed to connect to the Socket.IO server
      origins: '*:*',

      // Should we use heartbeats to check the health of Socket.IO connections?
      heartbeats: true,

      // When client closes connection, the # of seconds to wait before attempting a reconnect.
      // This value is sent to the client after a successful handshake.
      'close timeout': 60,

      // The # of seconds between heartbeats sent from the client to the server
      // This value is sent to the client after a successful handshake.
      'heartbeat timeout': 60,

      // The max # of seconds to wait for an expcted heartbeat before declaring the pipe broken
      // This number should be less than the `heartbeat timeout`
      'heartbeat interval': 25,

      // The maximum duration of one HTTP poll-
      // if it exceeds this limit it will be closed.
      'polling duration': 20,

      // Enable the flash policy server if the flashsocket transport is enabled
      'flash policy server': false,

      // By default the Socket.IO client will check port 10843 on your server 
      // to see if flashsocket connections are allowed.
      // The Adobe Flash Player normally uses 843 as default port, 
      // but Socket.io defaults to a non root port (10843) by default
      //
      // If you are using a hosting provider that doesn't allow you to start servers
      // other than on port 80 or the provided port, and you still want to support flashsockets 
      // you can set the `flash policy port` to -1
      'flash policy port': 10843,

      // Used by the HTTP transports. The Socket.IO server buffers HTTP request bodies up to this limit. 
      // This limit is not applied to websocket or flashsockets.
      'destroy buffer size': '10E7',

      // Do we need to destroy non-socket.io upgrade requests?
      'destroy upgrade': true,

      // Does Socket.IO need to serve the static resources like socket.io.js and WebSocketMain.swf etc.
      'browser client': true,

      // Cache the Socket.IO file generation in the memory of the process
      // to speed up the serving of the static files.
      'browser client cache': true,

      // Does Socket.IO need to send a minified build of the static client script?
      'browser client minification': false,

      // Does Socket.IO need to send an ETag header for the static requests?
      'browser client etag': false,

      // Adds a Cache-Control: private, x-gzip-ok="", max-age=31536000 header to static requests, 
      // but only if the file is requested with a version number like /socket.io/socket.io.v0.9.9.js.
      'browser client expires': 315360000,

      // Does Socket.IO need to GZIP the static files?
      // This process is only done once and the computed output is stored in memory. 
      // So we don't have to spawn a gzip process for each request.
      'browser client gzip': false,
      
      // A function that should serve all static handling, including socket.io.js et al.
      'browser client handler': false,

      // Meant to be used when running socket.io behind a proxy. 
      // Should be set to true when you want the location handshake to match the protocol of the origin. 
      // This fixes issues with terminating the SSL in front of Node 
      // and forcing location to think it's wss instead of ws.
      'match origin protocol' : false,

      // Global authorization for Socket.IO access, 
      // this is called when the initial handshake is performed with the server.
      // 
      // By default, Sails verifies that a valid cookie was sent with the upgrade request
      // However, in the case of cross-domain requests, no cookies are sent for some transports,
      // so sockets will fail to connect.  You might also just want to allow anyone to connect w/o a cookie!
      // 
      // To bypass this cookie check, you can set `authorization: false`,
      // which will silently create an anonymous cookie+session for the user
      // 
      // `authorization: true` indicates that Sails should use the built-in logic
      //
      // You can also use your own custom logic with:
      // `authorization: function (data, accept) { ... }`
      authorization: true,

      // Default onConnect behavior is a noop
      onConnect: function () {},

      // Direct access to the socket.io MQ store config
      // The 'adapter' property is the preferred method
      // (`undefined` indicates that Sails should defer to the 'adapter' config)
      store: undefined,

      // A logger instance that is used to output log information.
      // (`undefined` indicates deferment to the main Sails log config)
      logger: undefined,

      // The amount of detail that the server should output to the logger.
      // (`undefined` indicates deferment to the main Sails log config)
      'log level': undefined,

      // Whether to color the log type when output to the logger.
      // (`undefined` indicates deferment to the main Sails log config)
      'log colors': undefined,

      // A Static instance that is used to serve the socket.io client and its dependencies.
      // (`undefined` indicates use default)
      'static': undefined,

      // The entry point where Socket.IO starts looking for incoming connections. 
      // This should be the same between the client and the server.
      resource: '/socket.io'

    },

    grunt: {
      tasks: ['default'],
      gruntfile: undefined
    }

  };
};
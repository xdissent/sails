module.exports = function (http, middleware, routes, hooks, config) {
  
  middleware.build();
  routes.build();

  var usingSSL = config.server && config.server.key && config.server.cert,
    createServer = usingSSL ? require('https').createServer : require('http').createServer;

  var server = null;
  if (config.server.options) {
    server = createServer(config.server.options, http);
  } else {
    server = createServer(http);
  }

  var listen = null;
  if (config.server.host) {
    listen = function (callback) {
      server.listen(config.server.port, config.server.host, callback);
    };
  } else {
    listen = function (callback) {
      server.listen(config.server.port, callback);
    };
  }

  return {
    server: server,
    listen: listen
  };
};
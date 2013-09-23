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
  if (config.host) {
    listen = function (callback) {
      server.listen(config.port, config.host, callback);
    };
  } else {
    listen = function (callback) {
      server.listen(config.port, callback);
    };
  }

  return {
    server: server,
    listen: listen
  };
};
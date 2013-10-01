var _ = require('lodash');

module.exports = function (config, middleware, csrf, policies, routes) {
  middleware.insert_after(csrf, cors);
  routes.prependHandler(routeHandler);
  return cors;

  function routeHandler (route) {
    if (!config.cors) return;

    var options = {},
      enabled = config.cors.allRoutes,
      target = route.target;

    if (_.isPlainObject(target.cors)) {
      options = target.cors;
    } else if (target.cors === false) {
      enabled = true;
      options.clear = true;
    } else if (target.cors === true) {
      enabled = true;
    }

    if (!enabled) return;

    return {path: route.path, target: serveCors(options), verb: route.verb};
  }

  function serveCors (options) {
    return function (req, res, next) {
      options = _.extend({}, config.cors, options);
      if (options.clear) {
        options = {origin: '', credentials: '', methods: '', headers: '', clear: true};
      }
      var origin = _.find(options.origin.split(','), function (origin) {
        origin = origin.trim();
        return (origin === '*' || origin === req.headers.origin);
      });
      res.set('Access-Control-Allow-Origin', origin || '');
      res.set('Access-Control-Allow-Credentials', options.credentials);
      if (req.method === 'OPTIONS' || options.clear) {
        res.set('Access-Control-Allow-Methods', options.methods);
        res.set('Access-Control-Allow-Headers', options.headers);
      }
      next();
    };
  }

  function cors (req, res, next) {
    if (!config.cors || req.method !== 'OPTIONS') return next();
    return serveCors()(req, res, function (err) {
      if (err) return next(err);
      res.send(200);
    });
  }
};
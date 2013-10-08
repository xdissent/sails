var _ = require('lodash');

module.exports = function (config, middleware, csrf, router, log) {

  log = log.namespace('cors');

  middleware.insertAfter(csrf, cors);
  router.prependFilter(corsRoutesFilter());

  config.watch('cors', function () {
    log.verbose('Config changed');
    router.reload();
  });

  return cors;

  function corsRoutesFilter () {
    return function cors (routes) {
      return _(routes).map(routeFilter).flatten().compact().value();
    };
  }

  function routeFilter (route) {
    if (!config.cors) return route;

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

    if (!enabled) return route;

    if (_.isArray(route.target)) {
      route.target.unshift(serveCorsTarget(options));
    } else {
      route.target = [serveCorsTarget(options), route.target];
    }
    return route;
  }

  function serveCorsTarget (options) {
    var fn = function serveCors (req, res, next) {
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
    fn.toString = function () {
      if (options.clear) return '[CORS: disable]';
      return '[CORS: enable]';
    };
    return fn;
  }

  function cors (req, res, next) {
    if (!config.cors || req.method !== 'OPTIONS') return next();
    return serveCorsTarget()(req, res, function (err) {
      if (err) return next(err);
      res.send(200);
    });
  }
};
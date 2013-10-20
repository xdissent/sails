module.exports = function (config, http, router, middleware) {

  middleware.insertBefore(router.middleware, poweredBy);

  function poweredBy (req, res, next) {
    if (!config.poweredBy) return next();
    res.setHeader('X-Powered-By', config.poweredBy);
    next();
  }
};
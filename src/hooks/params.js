var _ = require('lodash');

module.exports = function (config, middleware, router) {
  middleware.insertBefore(router.middleware, params);
  return params;

  function params (req, res, next) {
    if (!_.isUndefined(req.params)) {
      return next();
    }

    Object.defineProperty(req, 'params', {
      get: function () {
        if (!req._dirty && req._params) {
          return req._params;
        }
        req._dirty = false;
        req._params = req._params || {};
        req._params.all = _.extend({}, req.query, req.body, req._params);
        return req._params;
      },
      set: function (value) {
        req._dirty = true;
        req._params = value;
      }
    });

    next();
  }
};
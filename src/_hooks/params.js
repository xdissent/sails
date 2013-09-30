var _ = require('lodash');

module.exports = function (config, middleware, bodyParser) {
  middleware.insert_after(bodyParser, params);
  return params;

  function params (req, res, next) {
    req.params = req.params || {};

    if (!_.isUndefined(req.params.all)) {
      return next();
    }

    var queryParams = _.clone(req.query) || {};
      bodyParams = _.clone(req.body) || {};
      allParams = _.extend({}, queryParams, bodyParams);

    _.each(Object.keys(req.params), function (name) {
      allParams[name] = req.params[name];
    });

    Object.defineProperty(req.params, 'all', {
      value: function getAllParams () {
        return allParams;
      }
    });

    next();
  }
};
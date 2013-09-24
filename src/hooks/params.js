var _ = require('lodash');

module.exports = function (config, middleware, bodyparser) {
  middleware.insert_after(bodyparser, params);
  return params;

  function params (req, res, next) {
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
  }
};
var _ = require('lodash');

module.exports = function (config, middleware, log) {

  log = log.namespace('notFound');

  middleware.append(notFound);
  return notFound;

  function notFound (req, res, next) {
    if (!config.notFound) return next();
    if (_.isFunction(config.notFound.handler)) {
      return config.notFound.handler(req, res, next);
    }
    if (!config.notFound.message) return res.send(404);
    res.send(404, config.notFound.message);
  }
};
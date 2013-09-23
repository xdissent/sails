var _ = require('lodash');

module.exports = function (http, middleware) {

  function Routes () {
    this._routes = [];
    this._handlers = [this.defaultHandler.bind(this)];
    this.middleware = http.router;
  };

  Routes.prototype.use = function (handler) {
    this._handlers.push(handler);
  };

  Routes.prototype.bind = function (path, target, verb, name) {
    var self = this;
    this._handlers.forEach(function (handler) {
      var routes = handler(path, target, verb, name);
      if (_.isEmpty(routes)) return;
      self._routes.push.apply(self._routes, [].concat(routes));
    });
  };

  Routes.prototype.defaultHandler = function (path, target, verb, name) {
    if (_.isFunction(target) || _.isArray(target)) {
      return {path: path, target: target, verb: verb, name: name};
    }
  };

  Routes.prototype.build = function () {
    _.each(this._routes, function (route) {
      http[route.verb || 'all'](route.path, route.target);
    });
  };

  var routes = new Routes;

  middleware.use(routes.middleware);

  return routes;
};
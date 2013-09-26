var _ = require('lodash');

module.exports = function (http, middleware, config) {

  function Routes () {
    this._routes = [];
    this._handlers = [this.defaultHandler.bind(this)];
    this.middleware = http.router;
    this.loadRoutes();
  }

  Routes.prototype.loadRoutes = function() {
    var self = this;
    _.each(config.routes, function (target, path) {
      path = path || '/*';
      var verb = path.replace(/^([^\/]+)?(\s+)?(\/.*)$/, '$1') || 'all';
      self._routes.push({path: path, target: target, verb: verb.toLowerCase()});
    });
  };

  Routes.prototype.prependHandler = function (handler) {
    this._handlers.unshift(handler);
  };

  Routes.prototype.appendHandler = function (handler) {
    this._handlers.push(handler);
  };

  Routes.prototype.bind = function (path, target, verb, name) {
    verb = verb || 'all';
    this._routes.push({path: path, target: target, verb: verb, name: name});
  };

  Routes.prototype.defaultHandler = function (route) {
    if (_.isFunction(route.target)) return route;
    if (!_.isArray(route.target)) return;
    var self = this;
    return _.compact(_.flatten(_.map(route.target, function (target) {
      return self.buildRoute(_.extend({}, route, {target: target}));
    })));
  };

  Routes.prototype.buildRoute = function(route) {
    return _.compact(_.flatten(_.map(this._handlers, function (handler) {
      return handler(route);
    })));
  };

  Routes.prototype.buildRoutes = function(routes) {
    var self = this;
    return _.compact(_.flatten(_.map(routes, function (route) {
      return self.buildRoute(route);
    })));
  };

  Routes.prototype.build = function () {
    _.each(this.buildRoutes(this._routes), function (route) {
      http[route.verb || 'all'](route.path, route.target);
    });
  };

  var routes = new Routes();

  middleware.use(routes.middleware);

  return routes;
};
var _ = require('lodash');

module.exports = function (http, middleware) {

  function Routes () {
    this._routes = [{path: '/test', target: {view: 'test'}, verb: 'get'}];
    this._handlers = [this.defaultHandler.bind(this)];
    this.middleware = http.router;
  }

  Routes.prototype.use = function (handler) {
    this._handlers.push(handler);
  };

  Routes.prototype.bind = function (path, target, verb, name) {
    this._routes.push({path: path, target: target, verb: verb, name: name});
  };

  Routes.prototype.defaultHandler = function (path, target, verb, name) {
    if (_.isFunction(target) || _.isArray(target)) {
      return {path: path, target: target, verb: verb, name: name};
    }
  };

  Routes.prototype.build = function () {
    var self = this;
    _.each(this._routes, function (route) {
      self._handlers.forEach(function (handler) {
        var routes = handler(route);
        if (_.isEmpty(routes)) return;
        _.each([].concat(routes), function (r) {
          http[r.verb || 'all'](r.path, r.target);
        });
      });
    });
  };

  var routes = new Routes();

  middleware.use(routes.middleware);

  return routes;
};
var _ = require('lodash'),
  methods = require('express/node_modules/methods');

module.exports = function (config, http, middleware, watcher, routeCompiler) {

  function Router () {
    var defaultFilter = this._defaultFilter.bind(this);
    defaultFilter.name = 'default';
    this._filters = [defaultFilter];
    this._routes = [];
    this.middleware = http.router;
    middleware.use(this.middleware);
    this.reload();
  }

  Router.prototype._defaultFilter = function (routes) {
    return _.map(routes, function (route) {
      if (!_.isFunction(route.target) && !_.isArray(route.target)) {
        route.target = this.setRequestTarget(route.target);
      }
      return route;
    }, this);
  };

  Router.prototype.use = function(filter, index) {
    if (_.isUndefined(index) || _.isNull(index)) index = this._filters.length;
    if (!_.isFunction(filter)) throw new Error('Invalid route filter');
    if (!_.isNumber(index) || index > this._filters.length || index < -1) {
      throw new Error('Invalid route filter index');
    }
    this._filters.splice(index, 0, filter);
    return this.reload();
  };

  Router.prototype.appendFilter = Router.prototype.use;

  Router.prototype.prependFilter = function (filter) {
    return this.use(filter, 0);
  };

  Router.prototype.insertFilterBefore = function (before, filter) {
    return this.use(filter, this.indexOf(before));
  };

  Router.prototype.insertFilterAfter = function (after, filter) {
    return this.use(filter, this.indexOf(after) + 1);
  };

  Router.prototype.indexOf = function(find) {
    return _.findIndex(this._filters, function (filter) {
      return filter.name === find || filter === find;
    });
  };

  Router.prototype.reload = function () {
    var routes = routeCompiler.compile(config.routes).concat(_.cloneDeep(this._routes));
    this.clear();
    _.each(this.filter(routes), this._bind, this);
    return this;
  };

  Router.prototype.filter = function(routes) {
    return _.compose.apply(_, _(_.clone(this._filters)).reverse().value())(routes);
  };

  Router.prototype._bind = function (route) {
    http[route.method](route.route, route.target);
    return this;
  };

  Router.prototype.clear = function () {
    _.each(methods, function (method) {
      http.routes[method] = [];
    });
    return this;
  };

  Router.prototype.unroute = function (where, self) {
    return _.remove(this._routes, where, self);
  };

  Router.prototype.route = function (method, route, target) {
    if (method === 'all') return this.all(route, target);
    this._routes.push({method: method, route: route, target: target});
    return this;
  };

  Router.prototype.setRequestTarget = function(target) {
    return function serveTarget (req, res, next) {
      req.target = target;
      next();
    };
  };

  Router.prototype.all = function (route, target) {
    _.each(methods, function (method) {
      this.route(method, route, target);
    }, this);
    return this;
  };

  _.each(methods, function (method) {
    Router.prototype[method] = function (route, target) {
      return this.route(method, route, target);
    };
    Router.prototype[method].name = method;
  });

  return new Router();
};
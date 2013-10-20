var _ = require('lodash'),
  events = require('events'),
  util = require('util'),
  methods = require('express/node_modules/methods').concat('all');

module.exports = function (config, http, middleware, routeCompiler, log) {

  log = log.namespace('router');

  function Router () {
    this.filters = [];
    this._routes = [];
    this.routes = [];
    this.middleware = http.router;
    middleware.use(this.middleware);

    var self = this;
    config.watch('routes', function () {
      log.verbose('Routes config changed');
      self.reload();
    });
  }

  util.inherits(Router, events.EventEmitter);

  Router.prototype.use = function(filter, index) {
    if (_.isUndefined(index) || _.isNull(index)) index = this.filters.length;
    if (!_.isFunction(filter)) throw new Error('Invalid route filter');
    if (!_.isNumber(index) || index > this.filters.length || index < -this.filters.length) {
      throw new Error('Invalid route filter index');
    }
    log.verbose('Using router filter ' + (filter.name || 'anonymous') + ' at index ' + index);
    this.filters.splice(index, 0, filter);
    return this;
  };

  Router.prototype.appendFilter = Router.prototype.use;

  Router.prototype.prependFilter = function (filter) {
    return this.use(filter, 0);
  };

  Router.prototype.insertFilterBefore = function (before, filter) {
    var index = this.indexOfFilter(before);
    if (index < 0) throw new Error('Could not find before filter');
    return this.use(filter, index);
  };

  Router.prototype.insertFilterAfter = function (after, filter) {
    var index = this.indexOfFilter(after);
    if (index < 0) throw new Error('Could not find after filter');
    return this.use(filter, index + 1);
  };

  Router.prototype.indexOfFilter = function(find) {
    return _.findIndex(this.filters, function (filter) {
      return filter.name === find || filter === find;
    });
  };

  Router.prototype.reload = function () {
    log.verbose('Reloading routes');
    var routes = routeCompiler.compile(config.routes).concat(_.cloneDeep(this._routes));
    this.clear();
    log.verbose('Compiled routes', routes);
    _.each(this.filter(routes), this._bind, this);
    this.emit('reload');
    return this;
  };

  Router.prototype.filter = function(routes) {
    return _.compose.apply(_, _(_.clone(this.filters)).reverse().value())(routes);
  };

  Router.prototype._bind = function (route) {
    log.verbose('Binding route', route);
    http[route.method](route.path, this._silence(route.target));
    this.routes.push(route);
    return this;
  };

  Router.prototype._silence = function(target) {
    if (_.isFunction(target)) return target;
    if (_.isArray(target)) return _.map(target, this._silence, this);
    return function INVALID (req, res, next) {
      next();
    };
  };

  Router.prototype.clear = function () {
    _.each(methods, function (method) {
      http.routes[method] = [];
    });
    this.routes = [];
    return this;
  };

  Router.prototype.unroute = function (where, self) {
    if (_.isString(where)) where = {name: where};
    return _.remove(this._routes, where, self);
  };

  Router.prototype.route = function (method, path, target, name) {
    log.verbose('Adding route', name, 'for', path, 'with target', target);
    this._routes.push({method: method, path: path, target: target, name: name});
    return this;
  };

  _.each(methods, function (method) {
    Router.prototype[method] = function (path, target) {
      return this.route(method, path, target);
    };
    Router.prototype[method].name = method;
  });

  return new Router();
};
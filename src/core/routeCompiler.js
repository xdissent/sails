var _ = require('lodash'),
  methods = require('express/node_modules/methods'),
  join = require('path').join;

module.exports = function () {
  function RouteCompiler () {
    this.routePathRe = new RegExp('^(?:(' + methods.join('|') + ')\\s+)?(\\/.*)');
  }

  RouteCompiler.prototype.isValidRoutePath = function (path) {
    return this.routePathRe.test(path);
  };

  RouteCompiler.prototype.parseRoutePath = function (path) {
    if (!_.isString(path)) throw new Error('Invalid route path: ' + path);
    var match = path.match(this.routePathRe);
    if (!match) return {};
    return {path: match[2], method: match[1]};
  };

  RouteCompiler.prototype.compile = function(routes, prefix, method) {
    return this.joinRoutes(this._compile(routes, prefix, method));
  };

  RouteCompiler.prototype._compile = function(routes, prefix, method) {
    var self = this;

    prefix = prefix || '';
    method = method || 'all';

    if (prefix === '/') prefix = '';

    return _(routes).map(function (target, path) {
      var parsed = self.parseRoutePath(path);

      parsed.path = join(prefix, parsed.path).replace(/(.+)\/$/, '$1');
      parsed.method = parsed.method || method;

      if (_.isString(target) || _.isFunction(target)) {
        parsed.target = target;
        return parsed;
      }

      if (_.isPlainObject(target)) {
        parsed.target = _.omit(target, function (target, path) {
          return self.isValidRoutePath(path) || path === 'method' || path === 'name';
        });
        var routes = _.omit(target, function (target, path) {
          return !self.isValidRoutePath(path);
        });
        var orig = _.clone(parsed);
        parsed.method = target.method || parsed.method;
        if (target.name) parsed.name = target.name;
        if (_.isEmpty(parsed.target)) parsed = null;
        return [parsed].concat(self._compile(routes, orig.path, orig.method));
      }

      if (_.isArray(target)) {
        return _.map(target, function (target) {
          return self._compile({'/': target}, parsed.path, parsed.method);
        });
      }

    }).flatten().compact().value();
  };

  RouteCompiler.prototype.joinRoutes = function(routes) {
    return _.reduce(routes, function (routes, route) {
      var last = routes[routes.length - 1];
      if (!last || last.method !== route.method || last.path !== route.path) {
        return routes.concat(route);
      }
      if (!_.isArray(last.target)) {
        last.target = [last.target];
      }
      last.target.push(route.target);
      return routes;
    }, []);
  };

  return new RouteCompiler();
};
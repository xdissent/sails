var _ = require('lodash'),
  methods = require('express/node_modules/methods'),
  path = require('path');

module.exports = function () {
  function RouteCompiler () {
    this.routeRe = new RegExp('^(?:(' + methods.join('|') + ')\\s+)?(\\/.*)');
  }

  RouteCompiler.prototype.isRoute = function (route) {
    return this.routeRe.test(route);
  };

  RouteCompiler.prototype.parseRoute = function (route) {
    if (!_.isString(route)) return {};
    var match = route.match(this.routeRe);
    if (!match) return {};
    return {route: match[2], method: match[1]};
  };

  RouteCompiler.prototype.compile = function(routes, prefix, method) {
    var self = this;

    prefix = prefix || '';
    method = method || 'all';

    if (prefix === '/') prefix = '';

    return _(routes).map(function (target, route) {

      if (!self.isRoute(route)) throw new Error('Invalid route: ' + route);

      var parsed = self.parseRoute(route);

      parsed.route = path.join(prefix, parsed.route).replace(/(.+)\/$/, '$1');
      parsed.method = parsed.method || method;

      if (_.isString(target) || _.isFunction(target)) {
        parsed.target = target;
        return parsed;
      }

      if (_.isPlainObject(target)) {
        parsed.target = _.omit(target, function (target, route) {
          return self.isRoute(route) || route === 'method';
        });
        var routes = _.omit(target, function (target, route) {
          return !self.isRoute(route);
        });
        var orig = _.clone(parsed);
        parsed.method = target.method || parsed.method;
        if (_.isEmpty(parsed.target)) parsed = null;
        return [parsed].concat(self.compile(routes, orig.route, orig.method));
      }

      if (_.isArray(target)) {
        return _.map(target, function (target) {
          return self.compile({'/': target}, parsed.route, parsed.method);
        });
      }

    }).flatten().compact().value();
  };

  return new RouteCompiler();
};
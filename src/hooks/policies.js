
var _ = require('lodash');

module.exports = function (config, moduleLoader, router, log) {

  log = log.namespace('policies');

  function chainPolicies (policies, req, res, next) {
    if (!_.isArray(policies)) {
      return policies(req, res, next);
    }
    if (_.isEmpty(policies)) return next();
    var policy = policies[0];
    policies = policies.slice(1);
    return policy(req, res, function (err) {
      if (err) return next(err);
      chainPolicies(policies, req, res, next);
    });
  }

  function Policies () {
    this._policies = {};
    this._map = {};

    router.use(this._filter());

    this.reload();
  }

  Policies.prototype.reload = function() {
    var policies = {};
    moduleLoader.optional({
      dirname: config.paths.policies,
      filter: /(.+)\.(js|coffee)$/,
      replaceExpr: null,
      force: true
    }, function modulesLoaded (err, modules) {
      if (err) throw err;
      policies = modules;
    });
    this._policies = policies;
    this._build();
  };

  Policies.prototype._filter = function() {
    var self = this;
    return function policies (routes) {
      return _(routes).map(self._routeFilter, self).flatten().compact().value();
    };
  };

  Policies.prototype._routeFilter = function(route) {
    if (!route || !route.target) return route;
    route.target = this._targetFilter(route.target);
    return route;
  };

  Policies.prototype._targetFilter = function(target) {
    if (_.isArray(target)) return _.map(target, this._targetFilter, this);
    if (!_.isFunction(target)) return target;

    var name, subname;
    if (target.controller && target.action) {
      name = target.controller;
      subname = target.action;
    } else if (target.view) {
      var pieces = target.view.split('/');
      name = pieces[0];
      subname = pieces[1];
    } else {
      return target;
    }

    var policies = this._map[name] || this._map['*'];
    if (_.isPlainObject(policies)) {
      policies = (subname && policies[subname]) || policies['*'] || mapping['*'];
    }

    if (!policies) return target;
    return _.compact(_.flatten([this._serve(policies), target]));
  };

  Policies.prototype._serve = function(policies) {
    return _.map(policies, function (policyFn) {
      var fn = function policy (req, res, next) {
        policyFn(req, res, next);
      };
      fn.toString = function () {
        var name = (policyFn.globalId || policyFn.name);
        if (name) return '[Policy: ' + name + ']';
        return '[Policy]';
      };
      return fn;
    }, this);
  };

  Policies.prototype._build = function (policies) {
    var map = {};
    _.each(config.policies, function (policy, controller) {
      controller = controller.replace(/Controller$/, '').toLowerCase();
      if (!_.isPlainObject(policy)) {
        map[controller] = this._normalize(policy);
        return;
      }
      map[controller] = {};
      _.each(policy, function (policy, action) {
        action = action.toLowerCase();
        map[controller][action] = this._normalize(policy);
      }, this);
    }, this);
    this._map = map;
  };

  Policies.prototype._normalize = function (policy) {
    if (_.isArray(policy)) {
      return _.flatten(_.map(policy, function (policy) {
        return this._normalize(policy);
      }, this));
    }

    if (_.isString(policy)) {
      policy = policy.toLowerCase();
      if (!this._policies[policy]) throw new Error('Unknown policy: ' + policy);
      return [this._policies[policy]];
    }

    if (_.isFunction(policy)) return [policy];
    if (policy === false || policy === null) return [denyPolicy];
    if (policy === true) return [allowPolicy];
    throw new Error('Invalid policy: ' + policy);
  };

  return new Policies();

  function denyPolicy (req, res, next) {
    res.send(403);
  }

  function allowPolicy (req, res, next) {
    next();
  }
};
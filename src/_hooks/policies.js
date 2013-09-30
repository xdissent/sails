
var _ = require('lodash');

module.exports = function (config, moduleLoader, routes) {
  var policies = loadPolicies(),
    mapping = buildPolicyMap();
  routes.prependHandler(routeHandler);
  return policies;

  function loadPolicies () {
    var policies = {};
    moduleLoader.optional({
      dirname: config.paths.policies,
      filter: /(.+)\.(js|coffee)$/,
      replaceExpr: null
    }, function modulesLoaded (err, modules) {
      if (err) throw err;
      policies = modules;
    });
    return policies;
  }

  function routeHandler (route) {
    if (!(_.isString(route.target) || (route.target && (route.target.controller || route.target.view)))) {
      return;
    }

    var target = null, subtarget = null;
    if (_.isString(route.target) || route.target.view) {
      target = route.target.view || route.target;
      var parsed = target.match(/^([^.\/]+)[\/.]?([^.\/]*)?$/);
      if (!parsed) return;
      target = parsed[1].replace(/Controller$/, '');
      subtarget = parsed[2] || 'index';
    } else if (route.target.controller) {
      target = route.target.controller;
      subtarget = route.target.action;
      if (route.verb !== 'all') {
        subtarget = subtarget || 'index';
      }
    } else {
      return;
    }

    if (_.isEmpty(target), _.isEmpty(subtarget)) return;
    target = target.toLowerCase();
    subtarget = subtarget.toLowerCase();
    return {path: route.path, target: servePolicy(target, subtarget), verb: route.verb};
  }

  function servePolicy(target, subtarget) {
    return function (req, res, next) {
      var policy = mapping[target] || mapping['*'];
      if (_.isPlainObject(policy)) {
        policy = policy[subtarget] || policy['*'] || mapping['*'];
      }
      if (!policy) return next();
      
      chainPolicies(policy, req, res, next);
    };
  }

  function chainPolicies(policies, req, res, next) {
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

  function buildPolicyMap (policies) {
    var mapping = {};
    _.each(config.policies, function (policy, controller) {
      controller = controller.replace(/Controller$/, '').toLowerCase();
      if (!_.isPlainObject(policy)) {
        mapping[controller] = normalizePolicy(policy);
        return;
      }
      mapping[controller] = {};
      _.each(policy, function (policy, action) {
        action = action.toLowerCase();
        mapping[controller][action] = normalizePolicy(policy);
      });
    });
    return mapping;
  }

  function normalizePolicy (policy) {
    if (_.isArray(policy)) {
      return _.flatten(_.map(policy, function (policy) {
        return normalizePolicy(policy);
      }));
    }

    if (_.isString(policy)) {
      policy = policy.toLowerCase();
      if (!policies[policy]) throw new Error('Unknown policy: ' + policy);
      return [policies[policy]];
    }

    if (_.isFunction(policy)) return [policy];
    if (policy === false || policy === null) return [denyPolicy];
    if (policy === true) return [allowPolicy];
    throw new Error('Invalid policy: ' + policy);
  }

  function denyPolicy (req, res, next) {
    res.send(403);
  }

  function allowPolicy (req, res, next) {
    next();
  }
};
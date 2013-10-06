
var _ = require('lodash');

module.exports = function (config, moduleLoader, router, middleware, log) {

  log = log.namespace('policies');

  var policies = loadPolicies(),
    mapping = buildPolicyMap();
  middleware.insertAfter(router.middleware, servePolicy);
  return policies;

  function loadPolicies () {
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
    return policies;
  }

  function servePolicy (req, res, next) {
    log.verbose('Serving policy');
    if (!req.target || !(req.target.controller || req.target.view)) return next();

    var target = null,
      subtarget = null;

    if (req.target.controller) {
      target = req.target.controller;
      subtarget = req.target.action;
    } else if (req.target.view) {
      var pieces = req.target.view.split('/');
      target = pieces[0];
      subtarget = pieces[1];
    }

    var policy = mapping[target] || mapping['*'];
    if (_.isPlainObject(policy)) {
      policy = (subtarget && policy[subtarget]) || policy['*'] || mapping['*'];
    }
    if (!policy) return next();
    
    chainPolicies(policy, req, res, next);
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
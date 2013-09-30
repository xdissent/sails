var _ = require('lodash');

module.exports = function (config, moduleLoader, middleware, router) {

  var controllers = loadControllers();
  router.insertFilterBefore('default', controllerRoutesFilter);
  middleware.insertAfter(router.middleware, serveControllerAction);
  return controllers;

  function loadControllers () {
    var controllers = {};
    moduleLoader.optional({
      dirname: config.paths.controllers,
      filter: /(.+)Controller\.(js|coffee)$/,
      replaceExpr: /Controller/
    }, function modulesLoaded (err, modules) {
      if (err) throw err;
      controllers = modules;
    });
    return controllers;
  }

  function controllerRoutesFilter (routes) {
    return _(routes).map(routeFilter).flatten().compact().value();
  }

  function routeFilter (route) {
    if (!route || !route.target) return route;
    if (_.isString(route.target)) {
      var parsed = route.target.match(/^([A-z]+)\.?([A-z]*)?$/);
      if (!parsed) return route;
      route.target = {};
      route.target.controller = parsed[1].replace(/Controller$/, '').toLowerCase();
      route.target.action = (_.isEmpty(parsed[2]) ? 'index' : parsed[2]).toLowerCase();
    } else if (route.target.controller) {
      route.target.action = route.target.action || 'index';
    }
    return route;
  }

  function serveControllerAction (req, res, next) {
    if (!req.target || !req.target.controller || !req.target.action) return next();
    var controller = controllers[req.target.controller];
    if (!controller) return next();
    var action = controller[req.target.action];
    if (!action) return next();
    if (_.isArray(action)) return chainControllerActions(action, req, res, next);
    return action(req, res, next);
  }

  function chainControllerActions (actions, req, res, next) {
    if (!_.isArray(actions)) {
      return actions(req, res, next);
    }
    if (_.isEmpty(actions)) return next();
    var action = actions[0];
    actions = actions.slice(1);
    return action(req, res, function (err) {
      if (err) return next(err);
      chainControllerActions(actions, req, res, next);
    });
  }
};
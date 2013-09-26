var _ = require('lodash');

module.exports = function (config, moduleLoader, routes) {

  var controllers = loadControllers();
  routes.appendHandler(routeHandler);
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

  function routeHandler (route) {
    if (!route.target || !(_.isString(route.target) || route.target.controller)) {
      return;
    }

    var controller = null, action = null;
    if (_.isString(route.target)) {
      var parsed = route.target.match(/^([^.]+)\.?([^.]*)?$/);
      if (!parsed) return;
      controller = parsed[1].replace(/Controller$/, '');
      action = parsed[2];
    } else if (route.target.controller) {
      controller = route.target.controller;
      action = route.target.action;
      if (route.verb !== 'all') {
        action = action || 'index';
      }
    } else {
      return;
    }

    if (_.isEmpty(controller), _.isEmpty(action)) return;
    controller = controller.toLowerCase();
    action = action.toLowerCase();
    return {path: route.path, target: serveControllerAction(controller, action), verb: route.verb};
  }

  function serveControllerAction (controller, action) {
    return function (req, res, next) {
      req.target = req.target || {};
      req.target.controller = controller;
      req.target.action = action;

      var controllerMiddleware = controllers[controller];
      if (!controllerMiddleware || !controllerMiddleware[action]) return next();
      if (_.isArray(controllerMiddleware[action])) {
        return chainControllerActions(controllerMiddleware[action], req, res, next);
      }
      return controllerMiddleware[action](req, res, next);
    };
  }

  function chainControllerActions (actions, req, res, next) {
    if (!_.isArray(actions)) {
      return actions(req, res, next);
    }
    if (_.isEmpty(actions)) return next();
    var action = actions[0],
      actions = actions.slice(1);
    return action(req, res, function (err) {
      if (err) return next(err);
      chainControllerActions(actions, req, res, next);
    });
  }
};
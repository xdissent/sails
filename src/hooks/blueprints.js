var _ = require('lodash');

module.exports = function (controllers, routes) {

  routes.use(function (route) {
    if (!route.target || !(_.isString(route.target) || route.target.controller)) {
      return;
    }

    var controllerId = null, actionId = null;

    if (_.isString(route.target)) {
      var parsed = route.target.match(/^([^.]+)\.?([^.]*)?$/);
      if (!parsed) {
        return;
      }
      controllerId = parsed[1];
      actionId = parsed[2];
    } else if (route.target.controller) {
      controllerId = route.target.controller;
      actionId = route.target.action;
    } else {
      return;
    }

    if (_.isEmpty(controllerId)) {
      return;
    }

    controllerId = controllerId.trim().toLowerCase();
    var controller = controllers[controllerId];

    if (!controller) {
      return;
    }

    if (route.verb || actionId) {
      actionId = (actionId || 'index').toLowerCase();
      if (!controllers[controllerId][actionId]) {
        return;
      }
      return {path: route.path, target: _serveBlueprint(controllerId, actionId), verb: route.verb};
    }

    // self.bindBlueprints(controller, route.path);
  });
};
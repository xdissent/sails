var util = require('../util');

module.exports = function (controllers, router) {

  router.use(function (route) {
    if (!route.target || !(util.isString(route.target) || route.target.controller)) {
      return;
    }

    var controllerId = null, actionId = null;

    if (util.isString(route.target)) {
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

    controllerId = util.normalizeControllerId(route.target.controller);

    if (util.isEmpty(controllerId)) {
      return;
    }

    var controller = controllers[controllerId];

    if (!controller) {
      return;
    }

    if (route.verb || actionId) {
      actionId = (actionId || 'index').toLowerCase();
      if (!sails.middleware.controllers[controllerId][actionId]) {
        return;
      }
      return {path: route.path, target: _serveBlueprint(controllerId, actionId), verb: route.verb};
    }

    controller = sails.controllers[controllerId];

    if (!controller) {
      return;
    }
    
    self.bindBlueprints(controller, route.path);
  });
};
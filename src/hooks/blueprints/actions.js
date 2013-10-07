var _ = require('lodash');

module.exports = function () {
  return {
    routes: function (controller) {
      var routes = {};
      _.each(controller, function (action, name) {
        if (!_.isArray(action) && !_.isFunction(action)) return;
        routes['/' + name] = {
          controller: controller.identity,
          action: name,
          name: controller.identity + '_' + name
        };
      });
      return routes;
    },

    controller: {}
  };
};
var _ = require('lodash');

module.exports = function (params, models) {
  var rest = require('./rest')(params, models);

  return {
    controller: rest.controller,

    routes: function (controller) {
      return {
        '/find/:id?': {
          controller: controller.identity,
          action: 'find',
          name: controller.identity + '_find_short'
        },
        '/create': {
          controller: controller.identity,
          action: 'create',
          name: controller.identity + '_create_short'
        },
        '/update/:id?': {
          controller: controller.identity,
          action: 'update',
          name: controller.identity + '_update_short'
        },
        '/destroy/:id?': {
          controller: controller.identity,
          action: 'destroy',
          name: controller.identity + '_destroy_short'
        }
      };
    }
  };
};
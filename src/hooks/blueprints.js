var _ = require('lodash'),
  path = require('path'),
  pluralize = require('pluralize');

module.exports = function (_container, config, middleware, controllers, moduleLoader, router, routeCompiler, log) {

  log = log.namespace('blueprints');

  var blueprints = loadBlueprints();
  middleware.insertAfter(router.middleware, serveBlueprint);
  loadBlueprintRoutes();
  return blueprints;

  function loadBlueprintRoutes () {
    log.verbose('Unrouting previous blueprint routes');
    router.unroute(function (route) {
      return route.target && route.target.blueprint;
    });
    log.verbose('Routing blueprint routes for all controllers');
    _.each(controllers, function (controller) {
      var prefix = controllerPrefix(controller);
      _.each(blueprintsForController(controller), function (blueprint) {
        var blueprintRoutes = blueprint.routes;
        if (_.isFunction(blueprintRoutes)) {
          blueprintRoutes = blueprintRoutes(controller);
        }
        _.each(routeCompiler.compile(blueprintRoutes, prefix), function (route) {
          var target = {controller: controller.identity, action: route.target, blueprint: true};
          router.route(route.method, route.route, target);
        });
      });
    });
    router.reload();
  }

  function loadBlueprints () {
    var blueprints = {};
    
    moduleLoader.optional({
      dirname: path.resolve(__dirname, '../blueprints'),
      filter: /^(.+)\.(js|coffee)$/
    }, function modulesLoaded (err, modules) {
      if (err) throw err;
      _.each(modules, function (blueprint) {
        blueprints[blueprint.globalId] = blueprint;
      });
    });

    moduleLoader.optional({
      dirname: config.paths.blueprints,
      filter: /^(.+)\.(js|coffee)$/
    }, function modulesLoaded (err, modules) {
      if (err) throw err;
      _.each(modules, function (blueprint) {
        blueprints[blueprint.globalId] = blueprint;
      });
    });

    var names = _.unique(_.flatten(_.map(controllers, blueprintNamesForController)));

    _.each(names, function (name) {
      if (!blueprints[name]) {
        try {
          blueprints[name] = require(name);
        } catch (e) {
          throw new Error('Invalid blueprint: ' + name);
        }
      }
      _container.register(name, blueprints[name]);
    });

    blueprintLoader.toString = blueprintLoaderToString;

    _container.register('__blueprints', blueprintLoader);
    return _container.get('__blueprints');

    function blueprintLoader () {
      var blueprints = {}, args = _.clone(arguments);
      _.each(names, function (name, index) {
        blueprints[name] = args[index];
      });
      return blueprints;
    }

    function blueprintLoaderToString () {
      return 'function (' + names.join(', ') + ') {}';
    }
  }

  function blueprintNamesForController (controller) {
    if (!controller) return [];
    if (controller.blueprint) {
      var blueprintConfig = blueprintConfigForController(controller);
      return _.compact(_.filter(config.blueprints, function (blueprint) {
        return blueprintConfig[blueprint] !== false;
      }));
    }
    return _.compact(controller.blueprints || config.blueprints);
  }

  function blueprintsForController (controller) {
    return _.compact(_.map(blueprintNamesForController(controller), function (blueprint) {
      return blueprints[blueprint];
    }));
  }

  function serveBlueprint (req, res, next) {
    if (!req.target || !req.target.controller || !req.target.action) return next();
    var controller = controllers[req.target.controller];
    if (!controller || controller[req.target.action]) return next();
    var blueprint = _.findLast(blueprintsForController(controller), function (blueprint) {
      return _.isFunction(blueprint.controller && blueprint.controller[req.target.action]);
    });
    if (!blueprint) return next();
    blueprint.controller[req.target.action](req, res, next);
  }

  function blueprintConfigForController (controller) {
    return _.extend({}, config.controllers.blueprints, controller.blueprint);
  }

  function controllerPrefix (controller) {
    // Merging controller blueprint config with app-level blueprint config
    var blueprintConfig = blueprintConfigForController(controller);
    return blueprintConfig.prefix + '/' + (blueprintConfig.pluralize ? pluralize(controller.identity) : controller.identity);
  }
};
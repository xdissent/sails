var _ = require('lodash'),
  path = require('path'),
  pluralize = require('pluralize');

module.exports = function (_container, config, controllers, moduleLoader, router, routeCompiler, log, watcher) {

  log = log.namespace('blueprints');

  function Blueprints () {
    this._watcher = null;
    this._blueprints = {};

    router.insertFilterBefore('controllers', this._filter());

    var self = this;
    config.watch('paths', function (key, previous, current) {
      if ((previous && previous.blueprints) !== (current && current.blueprints)) {
        log.verbose('Blueprints paths changed');
        self.reload();
      }
    });

    this.reload();
  }

  Blueprints.prototype._filter = function() {
    var self = this;
    return function blueprints (routes) {
      return _(routes).map(self._routeFilter, self).flatten().compact().value();
    };
  };

  Blueprints.prototype._routeFilter = function(route) {
    if (!route || !route.target) return route;
    route.target = this._targetFilter(route.target, route);
    return route;
  };

  Blueprints.prototype._targetFilter = function(target, route) {

    var actionWasMissing = false;
    if (_.isString(target)) {
      var parsed = target.match(/^([A-z]+)$/);
      actionWasMissing = parsed && !parsed[1];
    }

    if (_.isArray(target)) {
      return _.map(target, function (target) {
        return this._targetFilter(target, route);
      }, this);
    }

    target = controllers._targetFilter(target);

    if (!_.isPlainObject(target) || !target.controller || !target.action) {
      return target;
    }

    // if (actionWasMissing && route.method === 'all' && target.action === 'index') {
    //   return this._blueprintRoutes(target.controller, route.path);
    // }

    var blueprintId = target.blueprint;
    if (!blueprintId) {
      blueprintId = this._blueprint(target.controller, target.action);
    }
    if (!blueprintId) return target;

    target.blueprint = blueprintId;

    return this._serve(target.controller, target.action, blueprintId);
  };

  Blueprints.prototype._blueprint = function (controllerId, actionId) {
    if (!actionId || controllers._actionExists(controllerId, actionId)) return;
    return _.findLast(this._config(controllerId).enabled, function (name) {
      var blueprint = this._blueprints[name];
      if (!this._blueprints[name]) return false;
      var controller = this._blueprints[name].controller;
      return controller && (_.isFunction(controller[actionId]) || _.isArray(controller[actionId]));
    }, this);
  };

  Blueprints.prototype._config = function (controllerId) {
    if (!controllerId || !controllers[controllerId]) return {};
    var controller = controllers[controllerId];
    if (controller.blueprint === false) return {};
    if (controller.blueprint && controller.blueprint !== true) {
      return this._legacyConfig(controller);
    }
    if (!controller.blueprints) return config.blueprints;
    var defaults = controller.blueprints;
    if (_.isArray(defaults)) {
      defaults = {enabled: controller.blueprints};
    }
    return _.extend({}, config.blueprints, defaults);
  };

  Blueprints.prototype._legacyConfig = function (controller) {
    var legacy = _.extend({}, config.controllers.blueprints, controller.blueprint);
    legacy.enabled = _.compact(_.flatten(_.filter(config.blueprints, function (blueprint) {
      return legacy[blueprint] !== false;
    })));
    return legacy;
  };

  Blueprints.prototype._serve = function (controllerId, actionId, blueprintId) {
    var self = this;
    var fn = function blueprint (req, res, next) {
      req.target = {
        controller: controllerId,
        action: actionId,
        blueprint: blueprintId
      };
      var action = self._blueprints[blueprintId].controller[actionId];
      if (!_.isArray(action)) return action(req, res, next);
      chainBlueprintActions(action, req, res, next);
    };
    fn.toString = function () {
      return '[Controller: ' + controllerId + ', Action: ' + actionId + ', Blueprint: ' + blueprintId + ']';
    };
    fn.controller = controllerId;
    fn.action = actionId;
    fn.blueprint = blueprintId;
    return fn;
  };

  Blueprints.prototype._prefix = function(controllerId) {
    var cfg = this._config(controllerId);
    return cfg.prefix + '/' + (cfg.pluralize ? pluralize(controllerId) : controllerId);
  };

  Blueprints.prototype._route = function() {
    var routed = false;
    log.verbose('Unrouting previous blueprint routes');
    router.unroute(function (route) {
      if (!route.target || !route.target.blueprint) return false;
      return routed = true;
    });
    log.verbose('Routing blueprint routes for all controllers');
    _.each(controllers._controllers, function (controller, controllerId) {
      var prefix = this._prefix(controllerId);
      _.each(this._config(controllerId).enabled, function (name) {
        var blueprint = this._blueprints[name],
          routes = blueprint.routes;
        if (_.isFunction(routes)) routes = routes(controller);
        _.each(routeCompiler.compile(routes, prefix), function (route) {
          routed = true;
          var target = {controller: controllerId, action: route.target, blueprint: name};
          if (_.isPlainObject(route.target)) _.extend(target, route.target);
          router.route(route.method, route.path, target, route.name);
        });
      }, this);
    }, this);
    if (routed) router.reload();
  }

  Blueprints.prototype.reload = function() {
    var blueprints = {};

    log.verbose('Loading core blueprints');
    
    moduleLoader.optional({
      dirname: path.resolve(__dirname, 'blueprints'),
      filter: /^(.+)\.(js|coffee)$/
    }, function modulesLoaded (err, modules) {
      if (err) throw err;
      _.each(modules, function (blueprint) {
        blueprints[blueprint.globalId] = blueprint;
      });
      log.verbose('Loaded core blueprints', _.map(modules, 'globalId'));
    });

    log.verbose('Loading user blueprints from', config.paths.controllers);

    moduleLoader.optional({
      dirname: config.paths.blueprints,
      filter: /^(.+)\.(js|coffee)$/,
      force: true
    }, function modulesLoaded (err, modules) {
      if (err) throw err;
      _.each(modules, function (blueprint) {
        blueprints[blueprint.globalId] = blueprint;
      });
      log.verbose('Loaded user blueprints', _.map(modules, 'globalId'));
    });

    var names = _(controllers._controllers).keys().map(function (controllerId) {
      return this._config(controllerId).enabled;
    }, this).flatten().compact().unique().value();

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
    this._blueprints = _container.get('__blueprints');

    this._route();

    function blueprintLoader () {
      var blueprints = {}, args = _.clone(arguments);
      _.each(names, function (name, index) {
        blueprints[name] = args[index];
        blueprints[name].identity = name;
        log.verbose('Registering blueprint', name);
      });
      return blueprints;
    }

    function blueprintLoaderToString () {
      return 'function (' + names.join(', ') + ') {}';
    }
  }

  return new Blueprints();

  function chainBlueprintActions (actions, req, res, next) {
    if (!_.isArray(actions)) {
      return actions(req, res, next);
    }
    if (_.isEmpty(actions)) return next();
    var action = actions[0];
    actions = actions.slice(1);
    return action(req, res, function (err) {
      if (err) return next(err);
      chainBlueprintActions(actions, req, res, next);
    });
  }
};
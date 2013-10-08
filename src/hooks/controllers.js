var _ = require('lodash');

module.exports = function (config, moduleLoader, middleware, router, log, watcher) {

  log = log.namespace('controllers');

  function Controllers () {
    this._watcher = null;
    this._controllers = {};

    router.use(this._filter());

    var self = this;
    config.watch('paths', function (key, previous, current) {
      if ((previous && previous.controllers) !== (current && current.controllers)) {
        log.verbose('Controller paths changed');
        self.reload();
      }
    });

    this.reload();
  }

  Controllers.prototype._filter = function() {
    var self = this;
    return function controllers (routes) {
      return _(routes).map(self._routeFilter, self).flatten().compact().value();
    };
  };

  Controllers.prototype._routeFilter = function(route) {
    if (!route || !route.target) return route;
    route.target = this._targetFilter(route.target);
    return route;
  };

  Controllers.prototype._targetFilter = function(target) {
    if (_.isArray(target)) {
      return _.map(target, this._targetFilter, this);
    }

    if (_.isString(target)) {
      var parsed = target.match(/^([A-z]+)\.?([A-z]*)?$/);
      if (!parsed) return target;
      target = {};
      target.controller = parsed[1].replace(/Controller$/, '').toLowerCase();
      target.action = (_.isEmpty(parsed[2]) ? 'index' : parsed[2]).toLowerCase();
    }

    if (!_.isPlainObject(target)) return target;

    target.action = target.action || 'index';

    if (!this._exists(target.controller, target.action)) {
      return target;
    }

    return this._serve(target.controller, target.action);
  };

  Controllers.prototype._serve = function (controllerId, actionId) {
    var self = this;
    var fn = function controller (req, res, next) {
      req.target = {controller: controllerId, action: actionId};
      var action = self._controllers[controllerId][actionId];
      if (!_.isArray(action)) return action(req, res, next);
      chainControllerActions(action, req, res, next);      
    };
    fn.toString = function () {
      return '[Controller: ' + controllerId + ', Action: ' + actionId + ']';
    };
    return fn;
  };

  Controllers.prototype.reload = function() {
    log.verbose('Loading controllers from', config.paths.controllers);

    var self = this;
    moduleLoader.optional({
      dirname: config.paths.controllers,
      filter: /(.+)Controller\.(js|coffee)$/,
      replaceExpr: /Controller/,
      force: true
    }, function modulesLoaded (err, modules) {
      if (err) throw err;

      var current = _.keys(modules),
        previous = _.keys(this._controllers),
        removed = _.difference(previous, current);

      _.extend(self._controllers, modules);
      _.extend(self, modules);
      _.each(removed, function (key) {
        delete self._controllers[key];
        delete self[key];
      });
    });
    log.verbose('Loaded controllers', this._controllers);
    router.reload();
    this._watch();
  };

  Controllers.prototype._watch = function() {
    if (this._watcher) this._watcher.close();
    log.verbose('Watching', config.paths.controllers, 'for changes');
    var self = this;
    this._watcher = watcher(config.paths.controllers, function () {
      log.verbose('Controller files changed');
      self.reload();
    });
  };

  Controllers.prototype._exists = function (controllerId, actionId) {
    var controller = this._controllers[controllerId];
    if (!controller) return false;
    var action = controller[actionId];
    return (_.isArray(action) || _.isFunction(action));
  };

  return new Controllers();

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
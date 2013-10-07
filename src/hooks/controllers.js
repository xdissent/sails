var _ = require('lodash');

module.exports = function (config, moduleLoader, middleware, router, log, watcher) {

  log = log.namespace('controllers');

  var _watcher = null,
    controllers = {};

  loadControllers();
  watch();

  config.watch('paths', function (key, previous, current) {
    if ((previous && previous.controllers) !== (current && current.controllers)) {
      log.verbose('Controller paths changed');
      loadControllers();
      watch();
    }
  });

  router.insertFilterBefore('default', controllerRoutesFilter);
  middleware.insertAfter(router.middleware, serveControllerAction);
  return controllers;

  function watch() {
    if (_watcher) _watcher.close();
    _watcher = watcher(config.paths.controllers, function () {
      log.verbose('Controller files changed');
      loadControllers();
    });
  }

  function loadControllers () {
    log.verbose('Loading controllers from', config.paths.controllers);

    moduleLoader.optional({
      dirname: config.paths.controllers,
      filter: /(.+)Controller\.(js|coffee)$/,
      replaceExpr: /Controller/,
      force: true
    }, function modulesLoaded (err, modules) {
      if (err) throw err;

      var current = _.keys(modules),
        previous = _.keys(controllers),
        removed = _.difference(previous, current);

      _.extend(controllers, modules);
      _.each(removed, function (key) {
        delete controllers[key];
      });
    });
    log.verbose('Loaded controllers', controllers);
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
    if (_.isArray(action)) return chainControllerActions(action, req, res, next);
    if (!_.isFunction(action)) return next();
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
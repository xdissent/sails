var _ = require('lodash'),
  path = require('path');

module.exports = function (_container, config, moduleLoader) {
  var hooks = {};

  moduleLoader.optional({
    dirname: path.resolve(__dirname, '../hooks'),
    filter: /^(.+)\.(js|coffee)$/,
    depth: 2
  }, function modulesLoaded (err, modules) {
    if (err) throw err;
    _.each(modules, function (hook) {
      hooks[hook.globalId] = hook;
    });
  });

  moduleLoader.optional({
    dirname: config.paths.hooks,
    filter: /^(.+)\.(js|coffee)$/,
    depth: 2
  }, function modulesLoaded (err, modules) {
    if (err) throw err;

    _.each(modules, function (hook) {
      hooks[hook.globalId] = hook;
    });
  });

  _.each(config.hooks, function (name) {
    if (!_.isFunction(hooks[name])) {
      throw new Error('Invalid hook: ' + name);
    }
    _container.register(name, hooks[name]);
  });

  hookLoader.toString = hookLoaderToString;

  _container.register('__hooks', hookLoader);
  return _container.get('__hooks');

  function hookLoader () {
    var hooks = {}, args = _.clone(arguments);
    _.each(config.hooks, function (name, index) {
      hooks[name] = args[index];
    });
    return hooks;
  }

  function hookLoaderToString () {
    return 'function (' + config.hooks.join(', ') + ') {}';
  }
};
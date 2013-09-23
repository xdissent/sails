var _ = require('lodash'),
  path = require('path');

module.exports = function (_container, config, moduleLoader) {

  var allHooks = {};

  moduleLoader.optional({
    dirname: path.resolve(__dirname, '../hooks'),
    filter: /^(.+)\.(js|coffee)$/,
    depth: 2
  }, function (err, hooks) {
    if (err) throw err;

    _.merge(allHooks, hooks);
  });

  moduleLoader.optional({
    dirname: config.paths.hooks,
    filter: /^(.+)\.(js|coffee)$/,
    depth: 2
  }, function (err, hooks) {
    if (err) throw err;

    _.merge(allHooks, hooks);
  });

  _.each(config.hooks, function (name) {
    if (!_.isFunction(allHooks[name])) {
      throw new Error('Invalid hook: ' + name);
    }
    _container.register(name, allHooks[name]);
  });

  var hookLoader = function () {
    var hooks = {};
    _.each(config.hooks, function (name, index) {
      hooks[name] = arguments[index];
    });
    return hooks;
  };
  hookLoader.toString = function () {
    return 'function (' + config.hooks.join(', ') + ') {}';
  };

  _container.register('__hooks', hookLoader);
  return _container.get('__hooks');
};
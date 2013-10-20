var _ = require('lodash'),
  path = require('path'),
  async = require('async');

module.exports = function (_container, config, moduleLoader, router, log, done) {
  
  log = log.namespace('hooks');

  var hooks = {};

  moduleLoader.optional({
    dirname: path.resolve(__dirname, '../hooks'),
    filter: /^([^_].+)\.(js|coffee)$/,
    identity: false
  }, function modulesLoaded (err, modules) {
    if (err) throw err;
    log.verbose('Loaded core hooks', _.keys(modules));
    _.extend(hooks, modules);
  });

  moduleLoader.optional({
    dirname: config.paths.hooks,
    filter: /^([^_].+)\.(js|coffee)$/,
    identity: false
  }, function modulesLoaded (err, modules) {
    if (err) throw err;
    log.verbose('Loaded app hooks from', config.paths.hooks, _.keys(modules));
    _.extend(hooks, modules);
  });

  log.verbose('Validating hooks', config.hooks);

  var invalid = _.find(config.hooks, function (name) {
    return !_.isFunction(hooks[name]);
  });
  if (invalid) return done(new Error('Invalid hook: ' + invalid));

  _.each(config.hooks, function (name) {
    log.verbose('Registering hook', name);
    _container.register(name, hooks[name]);
  });

  async.series(_.map(config.hooks, function(name) {
    return function (callback) {
      _container.get(name, callback);
    };
  }), function (err, results) {
    if (err) return done(err);
    var hooks = {};
    _.each(config.hooks, function (name, index) {
      hooks[name] = results[index];
    });

    hooks.shutdown = function shutdown (cb) {
      async.each(_.values(hooks), function (hook, cb) {
        if (hook && _.isFunction(hook.shutdown)) return hook.shutdown(cb);
        cb();
      }, cb);
    };
    
    done(null, hooks);
  });
};
var _ = require('lodash');

module.exports = function (overrides, defaults, environment, moduleLoader) {
  var configPath = overrides.paths && overrides.paths.config || defaults.paths.config,
    config = _.clone(defaults);

  moduleLoader.aggregate({
    dirname: configPath,
    exclude: ['locales', 'local.js', 'local.coffee'],
    excludeDirs: ['locales'],
    filter: /(.+)\.(js|coffee)$/,
    identity: false
  }, function (err, appConfig) {
    if (err) throw err;
    merge(config, appConfig);
  });

  moduleLoader.aggregate({
    dirname: configPath,
    filter: /local\.(js|coffee)$/,
    identity: false
  }, function (err, localConfig) {
    if (err) throw err;
    merge(config, localConfig);

    if (localConfig[environment]) {
      merge(config, localConfig[environment]);
    }
  });

  merge(config, overrides);
  return config;

  function merge (dest, src) {
    return _.merge(dest, src, function(a, b) {
      return _.isArray(a) ? b : undefined;
    });
  }
};
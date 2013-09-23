var _ = require('lodash');

module.exports = function (overrides, defaults, environment, moduleLoader) {
  var configPath = overrides.paths && overrides.paths.config || defaults.paths.config,
    config = _.merge({}, defaults);

  moduleLoader.aggregate({
    dirname: configPath,
    exclude: ['locales', 'local.js', 'local.coffee'],
    excludeDirs: ['locales'],
    filter: /(.+)\.(js|coffee)$/,
    identity: false
  }, function (err, appConfig) {
    if (err) throw err;

    _.merge(config, appConfig);
  });

  moduleLoader.aggregate({
    dirname: configPath,
    filter: /local\.(js|coffee)$/,
    identity: false
  }, function (err, localConfig) {
    if (err) throw err;

    _.merge(config, localConfig);

    if (localConfig[environment]) {
      _.merge(config, localConfig[environment]);
    }
  });

  _.merge(config, overrides);

  return config;
};
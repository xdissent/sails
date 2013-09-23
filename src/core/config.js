var _ = require('lodash');

module.exports = function (overrides, defaults) {

  var config = {
    paths: {
      config: overrides.paths && overrides.paths.config || defaults.paths.config
    }
  };

  Modules.aggregate({
    dirname: config.paths.config,
    exclude: ['locales', 'local.js', 'local.coffee'],
    excludeDirs: ['locales'],
    filter: /(.+)\.(js|coffee)$/,
    identity: false
  }, function (err, appConfig) {
    _.merge(config, appConfig);
  });

  Modules.aggregate({
    dirname: config.paths.config,
    filter: /local\.(js|coffee)$/,
    identity: false
  }, function (err, localConfig) {
    _.merge(config, localConfig);
  });

  _.merge(config, overrides);

  return config;
};
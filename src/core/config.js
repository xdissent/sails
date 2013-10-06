var _ = require('lodash'),
  WatchJS = require('watchjs');

module.exports = function (overrides, defaults, environment, moduleLoader, watcher) {

  var _watcher = null;

  function Config () {
    this.reload();
  }

  Config.prototype._reload = function (path, target) {
    var config = _.clone(defaults);

    moduleLoader.aggregate({
      dirname: path,
      exclude: ['locales', 'local.js', 'local.coffee'],
      excludeDirs: ['locales'],
      filter: /(.+)\.(js|coffee)$/,
      identity: false,
      force: true
    }, function (err, appConfig) {
      if (err) throw err;
      merge(config, appConfig);
    });

    moduleLoader.aggregate({
      dirname: path,
      filter: /local\.(js|coffee)$/,
      identity: false,
      force: true
    }, function (err, localConfig) {
      if (err) throw err;
      merge(config, localConfig);

      if (localConfig[environment]) {
        merge(config, localConfig[environment]);
      }
    });

    merge(config, overrides);
    merge(target, config);
  }

  Config.prototype.reload = function () {
    var config = {},
      path = (this.paths && this.paths.config) || (overrides.paths && overrides.paths.config) || defaults.paths.config;

    if (typeof path !== 'string') {
      throw new Error('Invalid config path' + path);
    }

    var reloaded = 0;
    while (true) {
      if (reloaded >= 5) {
        throw new Error('Config reloaded too many times: ' + reloaded);
      }

      this._reload(path, config);
      reloaded++;

      if (!config.paths || typeof config.paths.config !== 'string') {
        throw new Error('Invalid config path' + (config.paths && config.paths.config || 'undefined'));
      }

      if (config.paths.config === path) break;
      path = config.paths.config;
    }

    merge(this, config);
    _.forIn(this, function (val, key) {
      if (!_.has(config, key)) delete this[key];
    }, this);

    this._watch();
    return this;
  };

  Config.prototype._watch = function() {
    if (_watcher) {
      _watcher.close();
    }
    var self = this;
    _watcher = watcher(this.paths.config, function () {
      self.reload();
    });
  };

  Config.prototype.watch = function (keys, cb, level, watchNew) {
    var args = [].slice.apply(arguments);
    args.unshift(this);
    WatchJS.watch.apply(WatchJS, args);
  };

  Config.prototype.unwatch = function (keys, cb, level, watchNew) {
    var args = arguments.slice();
    args.unshift(this);
    WatchJS.unwatch.apply(WatchJS, args);
  };

  function merge (dest, src) {
    return _.merge(dest, src, function(a, b) {
      return _.isArray(a) ? b : undefined;
    });
  }

  return new Config();
};
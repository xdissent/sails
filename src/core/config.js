var _ = require('lodash'),
  events = require('events'),
  util = require('util');

module.exports = function (overrides, defaults, environment, moduleLoader, watcher) {

  function Config () {
    events.EventEmitter.call(this);
    this.reload();
  }

  util.inherits(Config, events.EventEmitter);

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

    this.update(config);
    this._watch();

    return this;
  };

  Config.prototype.update = function(config) {
    var changed = [];

    _.forIn(config, function (val, key) {
      if (_.isEqual(this[key], val)) return;
      changed.push(key);
      var old = this[key];
      this[key] = val;
      this.emit('key', key, old, val);
    }, this);

    _.forIn(this, function (val, key) {
      if (_.has(config, key)) return;  
      changed.push(key);
      delete this[key];
      this.emit('key', key, val, undefined);
    }, this);

    if (!_.isEmpty(changed)) this.emit('all');
  };

  var _watcher = null;
  Config.prototype._watch = function() {
    if (_watcher) {
      _watcher.close();
    }
    var self = this;
    _watcher = watcher(this.paths.config, function () {
      self.reload();
    });
  };

  Config.prototype.watchAll = function(cb) {
    if (!_.isFunction(cb)) throw new Error('callback required');
    this.on('all', cb);
  };

  Config.prototype.watch = function (keys, cb) {
    if (_.isFunction(keys)) {
      cb = keys;
      keys = null;
    }
    if (!_.isFunction(cb)) throw new Error('callback required');
    if (_.isEmpty(keys)) return this.watchAll(cb);
    _.each([].concat(keys), function (key) {
      this.on('key', function (k) {
        if (k === key) cb.apply(null, arguments);
      });
    }, this);
  };

  // Config.prototype.watch = function (keys, cb, level, watchNew) {
  //   var args = [].slice.apply(arguments);
  //   args.unshift(this);
  //   WatchJS.watch.apply(WatchJS, args);
  // };

  // Config.prototype.unwatch = function (keys, cb, level, watchNew) {
  //   var args = arguments.slice();
  //   args.unshift(this);
  //   WatchJS.unwatch.apply(WatchJS, args);
  // };

  function merge (dest, src) {
    return _.merge(dest, src, function(a, b) {
      return _.isArray(a) ? b : undefined;
    });
  }

  return new Config();
};
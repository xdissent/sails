var _ = require('lodash');

module.exports = function (_container, config, moduleLoader, log, watcher, globals, done) {

  log = log.namespace('services');

  function Services () {
    this._watcher = null;
    this._services = {};
    this.globalized = false;

    var self = this;
    config.watch('paths', function (key, previous, current) {
      if ((previous && previous.services) !== (current && current.services)) {
        log.verbose('Services paths changed');
        self.reload();
      }
    });

    config.watch('globals', function (key, previous, current) {
      if ((previous && previous.services) !== (current && current.services)) {
        log.verbose('Services globals changed');
        self.reload();
      }
    });

    this.reload(done);
  }

  Services.prototype.reload = function(callback) {
    log.verbose('Loading services from', config.paths.services);

    callback = callback || function (err) {
      if (err) throw err;
    };

    this.unglobalize();

    var self = this;
    moduleLoader.optional({
      dirname: config.paths.services,
      filter: /(.+)Service\.(js|coffee)$/,
      replaceExpr: /Service/,
      force: true
    }, function modulesLoaded (err, modules) {
      if (err) return callback(err);

      var current = _.keys(modules),
        previous = _.keys(this._services),
        removed = _.difference(previous, current),
        added = _.difference(current, previous);


      _.each(added, function (name) {
        _container.register(name, modules[name]);
      });

      _container.register('__services', self._loader(added));

      _container.get('__services', function (err, services) {
        if (err) return callback(err);
        _.each(services, function (service, name) {
          service.globalId = modules[name].globalId;
        });
        _.extend(self._services, services);
        _.extend(self, services);
        _.each(removed, function (key) {
          delete self._services[key];
          delete self[key];
        });

        log.verbose('Loaded services', self._services);

        self.globalize();
        self._watch();
        callback(null, self);
      });
    });
  };

  Services.prototype._loader =  function (names) {
    var loader = function () {
      var services = {}, args = _.clone(arguments);
      _.each(names, function (name, index) {
        services[name] = args[index];
        services[name].identity = name;
        log.verbose('Registering service', name);
      });
      return services;
    };
    loader.toString = function () {
      return 'function (' + names.join(', ') + ') {}';
    };
    return loader;
  };

  Services.prototype._watch = function() {
    if (this._watcher) this._watcher.close();
    log.verbose('Watching', config.paths.services, 'for changes');
    var self = this;
    this._watcher = watcher(config.paths.services, function () {
      log.verbose('Services files changed');
      self.reload();
    });
  };

  Services.prototype.globalize = function () {
    if (this.globalized || !config.globals || !config.globals.services) return;
    _.each(this._services, function (service) {
      log.verbose('Globalizing service', service.globalId + 'Service');
      globals.globalize(service.globalId + 'Service', service);
    });
    this.globalized = true;
  };

  Services.prototype.unglobalize = function () {
    if (!this.globalized) return;
    _.each(this._services, function (service) {
      log.verbose('Unglobalizing service', service.globalId + 'Service');
      globals.unglobalize(service.globalId + 'Service');
    });
    this.globalized = false;
  };

  return new Services();
};
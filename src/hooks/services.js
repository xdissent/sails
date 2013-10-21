var _ = require('lodash');

module.exports = function (config, moduleLoader, log, watcher, globals) {

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

    this.reload();
  }

  Services.prototype.reload = function() {
    log.verbose('Loading services from', config.paths.services);

    this.unglobalize();

    var self = this;
    moduleLoader.optional({
      dirname: config.paths.services,
      filter: /(.+)Service\.(js|coffee)$/,
      replaceExpr: /Service/,
      force: true
    }, function modulesLoaded (err, modules) {
      if (err) throw err;

      var current = _.keys(modules),
        previous = _.keys(this._services),
        removed = _.difference(previous, current);

      _.extend(self._services, modules);
      _.extend(self, modules);
      _.each(removed, function (key) {
        delete self._services[key];
        delete self[key];
      });
    });
    log.verbose('Loaded services', this._services);

    this.globalize();
    this._watch();
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
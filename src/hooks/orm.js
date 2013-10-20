var orm = require('../../lib/hooks/orm'),
  _ = require('lodash');

module.exports = function (appPath, config, globals, moduleLoader, watcher, log, done) {

  log = log.namespace('orm');

  function ORM () {
    this._modelWatcher = null;
    this._adapterWatcher = null;
    this.globalized = false;
    this.models = {};
    this.reload(function(err, self) {
      if (err) return done(err);

      config.watch('paths', function (key, previous, current) {
        var changed = false;
        if ((previous && previous.adapters) !== (current && current.adapters)
            || (previous && previous.models) !== (current && current.models)) {
          log.verbose('ORM paths changed');
          self.reload();
        }
      });

      config.watch('orm', function (key, previous, current) {
        var changed = false;
        if ((previous && previous.connections) !== (current && current.connections)) {
          log.verbose('ORM connections changed');
          self.reload();
        }
      });

      done(null, self);
    });
  }

  ORM.prototype._sails = function () {
    var connections = _.cloneDeep(config.orm && config.orm.connections || {}),
      defaultConnection = [].concat(_.cloneDeep(connections['default'] || []));

    return {
      log: log,
      config: {
        appPath: appPath,
        globals: {models: false},
        model: {connections: defaultConnection},
        paths: {
          models: config.paths.models,
          adapters: config.paths.adapters
        },
        adapters: _.cloneDeep(config.adapters),
        connections: connections
      },
      modules: {
        optional: function (opts, cb) {
          opts.force = true;
          moduleLoader.optional(opts, cb);
        }
      }
    }
  };

  ORM.prototype.clear = function () {
    _.each(_.keys(this.models), function (model) {
      delete this.models[model];
    }, this);
  };

  ORM.prototype.update = function (models) {
    _.extend(this.models, models);
  };

  ORM.prototype.reload = function (cb) {
    log.verbose('Reloading ORM');

    cb = cb || function (err) {
      if (err) throw err;
    };

    var sails = this._sails(),
      legacy = orm(sails),
      self = this;

    legacy.configure();
    legacy.initialize(function (err) {
      if (err) return cb(err);
      self.unglobalize();
      self.clear();
      self.update(sails.models);
      self.globalize();
      self._watchModels();
      self._watchAdapters();
      cb(null, self);
    });
  };

  ORM.prototype.globalize = function () {
    if (this.globalized || !config.globals || !config.globals.models) return;
    _.each(this.models, function (model) {
      log.verbose('Globalizing model', model.globalId);
      globals.globalize(model.globalId, model);
    });
    this.globalized = true;
  };

  ORM.prototype.unglobalize = function () {
    if (!this.globalized) return;
    _.each(this.models, function (model) {
      globals.unglobalize(model._model.globalId);
    });
    this.globalized = false;
  };

  ORM.prototype._watchModels = function () {
    if (this._modelWatcher) this._modelWatcher.close();
    log.verbose('Watching', config.paths.models, 'for changes');
    var self = this;
    this._modelWatcher = watcher(config.paths.models, function () {
      log.verbose('Model files changed');
      self.reload();
    });
  };

  ORM.prototype._watchAdapters = function () {
    if (this._adapterWatcher) this._adapterWatcher.close();
    log.verbose('Watching', config.paths.adapters, 'for changes');
    var self = this;
    this._adapterWatcher = watcher(config.paths.adapters, function () {
      log.verbose('Adapter files changed');
      self.reload();
    });
  };

  new ORM();
};
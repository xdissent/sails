var orm = require('../../lib/hooks/orm'),
  _ = require('lodash');

module.exports = function (appPath, config, globals, moduleLoader, log, done) {

  log = log.namespace('orm');

  function ORM () {
    this.globalized = false;
    this.models = {};
    this.reload(done);
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
      cb(null, self);
    });
  };

  ORM.prototype.globalize = function() {
    if (this.globalized || !config.globals || !config.globals.models) return;
    _.each(this.models, function (model) {
      log.verbose('Globalizing model', model.globalId);
      globals.globalize(model.globalId, model);
    });
    this.globalized = true;
  };

  ORM.prototype.unglobalize = function() {
    if (!this.globalized) return;
    _.each(this.models, function (model) {
      globals.unglobalize(model._model.globalId);
    });
    this.globalized = false;
  };

  new ORM();
};
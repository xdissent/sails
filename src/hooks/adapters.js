var _ = require('lodash');

module.exports = function (config, moduleLoader) {

  function Adapters () {
    this._modules = {};
    this._adapters = this.loadAdapters();
  }

  Adapters.prototype.loadAdapters = function () {
    var adapters = {};
    moduleLoader.optional({
      dirname: config.paths.adapters,
      filter: /(.+Adapter)\.(js|coffee)$/,
      replaceExpr: /Adapter$/
    }, function modulesLoaded (err, modules) {
      if (err) throw err;
      adapters = modules;
    });

    _.each(adapters, function (adapter, name) {
      adapter.config = adapter.config || {};
      adapter.defaults = adapter.defaults || {};
      _.extend(adapter.config, adapter.defaults, this.config(name));
    }, this);

    return adapters;
  };

  Adapters.prototype.config = function (name) {
    if (_.isString(config.adapters[name])) {
      return this.config(config.adapters[name]);
    }
    return config.adapters[name];
  };

  Adapters.prototype.load = function(name) {
    var adapter = this._adapters[name];
    if (adapter) return adapter;
    var adapterConfig = this.config(name);
    if (!adapterConfig.module) throw new Error('Invalid adapter config');
    adapter = this._adapters[name] = require(adapterConfig.module);
    adapter.config = adapter.config || {};
    adapter.defaults = adapter.defaults || {};
    _.extend(adapter.config, adapter.defaults, this.config(name));
    return adapter;
  };

  return new Adapters();
};
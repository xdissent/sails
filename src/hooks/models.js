var _ = require('lodash'),
  waterline = require('waterline');

module.exports = function (config, moduleLoader, adapters) {
  var modelDefinitions = loadModelDefinitions(),
    models = loadModels();
  return models;

  function loadModelDefinitions () {
    var models = {};
    moduleLoader.optional({
      dirname: config.paths.models,
      filter: /(.+)\.(js|coffee)$/
    }, function modulesLoaded (err, modules) {
      if (err) throw err;
      models = modules;
    });
    return models;
  }

  function loadModels () {
    var models = {};
    _.each(modelDefinitions, function (model, name) {
      models[name] = loadCollection(model);
    });
    return models;
  }

  function loadCollection (model) {
    var modelAdapters = _.unique(_.compact(_.flatten([].concat(model.adapter))));
    if (_.isEmpty(modelAdapters)) {
      modelAdapters.push('default');
    }
    var adapter = adapters.load(modelAdapters[0]),
      defaultSchema = adapter.config && !_.isUndefined(adapter.config.schema),
      overrideSchema = !_.isUndefined(model.schema);

    if (defaultSchema && !overrideSchema) {
      model.schema = adapter.config && adapter.config.schema;
    }

    var clonedAdapters = _.clone(adapters._adapters);
    if (model.config) {
      _.each(modelAdapters, function (adapter) {
        _.extend(clonedAdapters[adapter].config, model.config);
      });
    }

    var Model = waterline.Collection.extend(model);
    var collection = null;
    new Model({
      tableName: model.identity,
      adapters: clonedAdapters
    }, function (err, model) {
      if (err) throw err;
      collection = model;
    });

    global[model.globalId || model.identity] = collection;

    return collection;
  }
};
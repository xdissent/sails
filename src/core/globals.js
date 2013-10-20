var _ = require('lodash');

module.exports = function (log) {

  log = log.namespace('globals');

  function Globals () {
    this._globals = {};
  }

  Globals.prototype.globalize = function (name, value) {
    if (_.isEmpty(name)) throw new Error('Name required');
    if (_.isUndefined(value) || _.isNull(value)) throw new Error('Value required');
    if (!_.isUndefined(this._globals[name])) throw new Error('Already globalized');
    log.verbose('Globalizing', name);
    global[name] = this._globals[name] = value;
  };

  Globals.prototype.unglobalize = function (name) {
    if (_.isArray(name)) return _.each(name, this.unglobalize, this);
    
    if (_.isObject(name)) {
      var names = _.keys(_.pick(this._globals, function (value, key) {
        return name === value;
      }));
      return this.unglobalize(names);
    }

    if (!_.isString(name) || _.isEmpty(name)) throw new Error('Name required');
    if (_.isUndefined(this._globals[name])) throw new Error('Not globalized');

    log.verbose('Removing global', name);
    delete global[name];
    delete this._globals[name];
  };

  Globals.prototype.unglobalizeAll = function () {
    log.verbose('Removing all globals');
    this.unglobalize(_.keys(this._globals));
  };

  return new Globals;
};
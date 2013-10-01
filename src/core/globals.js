var _ = require('lodash');

module.exports = function (config) {
  function Globals () {
    this._globals = {};
  }

  Globals.prototype.globalize = function (name, obj) {
    global[name] = this._globals[name] = obj;
  };

  Globals.prototype.unglobalize = function (name) {
    if (_.isArray(name)) return _.each(name, this.unglobalize, this);
    
    if (_.isObject(name)) {
      var names = _.keys(_.pick(this._globals, function (value, key) {
        return name === value;
      }));
      return this.unglobalize(names);
    }

    if (!_.isString(name)) return;
    delete global[name];
    delete this._globals[name];
  };

  Globals.unglobalizeAll = function (obj) {
    this.unglobalize(_.keys(this._globals));
  };

  return new Globals;
};
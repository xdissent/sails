var dependable = require('dependable'),
  _ = require('lodash'),
  path = require('path'),
  fs = require('fs');

module.exports = Sails;

function Sails (overrides) {
  var container = this.container = dependable.container();
  container.register('overrides', overrides || {});
  container.load(Sails.corePath);
  container.get('hooks');

  if (this.config.globals.sails) this.globals.globalize('sails', this);
}

Sails.corePath = path.join(__dirname, 'core');

Sails.coreModules = function () {
  return _.map(fs.readdirSync(Sails.corePath), function (file) {
    return path.basename(file, '.js');
  });
};

_.each(Sails.coreModules(), function (name) {
  Object.defineProperty(Sails.prototype, name, {
    get: function() {
      return this.container.get(name);
    }
  });
});

Sails.prototype.lift = function (cb) {
  this.server.listen(cb);
};

Sails.prototype.lower = function (cb) {
  this.server.close(cb);
};

Sails.cli = function () {
  require('./cli').apply(null, arguments);
};
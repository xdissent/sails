var dependable = require('dependable'),
  _ = require('lodash'),
  path = require('path'),
  fs = require('fs');

module.exports = Sails;

function Sails (overrides) {
  var container = this.container = dependable.container();
  container.register('overrides', overrides || {});
  container.load(Sails.corePath);
  if (this.config.globals.sails) this.globals.globalize('sails', this);
}

Sails.corePath = path.join(__dirname, 'core');

Sails.coreModules = function () {
  return _.map(fs.readdirSync(Sails.corePath), function (file) {
    return path.basename(file, '.js');
  }).concat('overrides');
};

_.each(Sails.coreModules(), function (name) {
  Object.defineProperty(Sails.prototype, name, {
    get: function() {
      return this.container.get(name);
    }
  });
});

Sails.prototype.boot = function (cb) {
  var sails = this, start = new Date();
  sails.log.verbose('Booting sails');
  sails.container.get('hooks', function (err, hooks) {
    if (err) return cb(err);
    sails.router.reload();
    sails.log.verbose('Sails booted in', (new Date() - start) / 1000, 'seconds');
    cb(err, sails);
  });
};

Sails.prototype.lift = function (cb) {
  var sails = this, start = new Date();
  sails.log.verbose('Lifting sails');
  sails.boot(function (err) {
    if (err) return cb(err);
    sails.server.listen(function (err) {
      if (err) return cb(err);
      sails.log.verbose('Sails lifted in', (new Date() - start) / 1000, 'seconds');
      cb(null, sails);
    });
  });
};

Sails.prototype.lower = function (cb) {
  var sails = this, start = new Date();
  sails.log.verbose('Lowering sails');
  sails.server.close(function (err) {
    if (err) return cb(err);
    sails.log.verbose('Sails lowered in', (new Date() - start) / 1000, 'seconds');
    cb(null, sails);
  });
};

Sails.cli = function () {
  require('./cli').apply(null, arguments);
};
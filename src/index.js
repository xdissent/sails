var dependable = require('dependable'),
  _ = require('lodash'),
  async = require('async'),
  path = require('path'),
  fs = require('fs');

// Attempt to preload coffee-script for user requires.
try {
  require('coffee-script');
} catch (err) {}

module.exports = Sails;

function Sails (overrides) {
  this._init(overrides);
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

Sails.prototype._init = function (overrides) {
  var container = this.container = dependable.container();
  container.register('overrides', overrides || {});
  container.load(Sails.corePath);
  this.booted = false;
  this.lifted = false;
};

Sails.prototype.boot = function (cb) {
  if (this.booted) return cb();
  var sails = this, start = new Date();
  sails.log.verbose('Booting sails');
  sails.container.get('hooks', function (err, hooks) {
    if (err) return cb(err);
    sails.router.reload();
    sails.booted = true;
    sails.log.verbose('Sails booted in', (new Date() - start) / 1000, 'seconds');
    cb(null, sails);
  });
};

Sails.prototype.lift = function (cb) {
  if (this.lifted) return cb();
  var sails = this, start = new Date();
  sails.log.verbose('Lifting sails');
  sails.boot(function (err) {
    if (err) return cb(err);
    sails.server.listen(function (err) {
      if (err) return cb(err);
      sails.lifted = true;
      sails.log.verbose('Sails lifted in', (new Date() - start) / 1000, 'seconds');
      cb(null, sails);
    });
  });
};

Sails.prototype.lower = function (cb) {
  if (!this.lifted) return cb();
  var sails = this, start = new Date();
  sails.log.verbose('Lowering sails');
  sails.server.close(function (err) {
    if (err) return cb(err);
    this.lifted = false;
    sails.log.verbose('Sails lowered in', (new Date() - start) / 1000, 'seconds');
    cb(null, sails);
  });
};

Sails.prototype.shutdown = function (cb) {
  if (!this.booted) return cb();
  var sails = this, start = new Date();
  sails.log.verbose('Shutting down sails');
  sails.lower(function (err) {
    if (err) return cb(err);
    sails.watcher.shutdown(function (err) {
      if (err) return cb(err);
      sails.hooks.shutdown(function (err) {
        if (err) return cb(err);
        sails.booted = false;
        sails.log.verbose('Sails shut down in', (new Date() - start) / 1000, 'seconds');
        sails._init(sails.overrides);
        cb(null, sails);
      });
    });
  });
};

Sails.cli = function () {
  require('./cli').apply(null, arguments);
};
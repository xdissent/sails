var Sails = require('../../src'),
  assert = require('assert'),
  sails = null, config = null, overrides = null, defaults = null;

describe('config', function () {

  beforeEach(function () {
    sails = new Sails({hooks: [], test: 1});
    config = sails.config;
    overrides = sails.overrides;
    defaults = sails.defaults;
  });

  it('should merge in overrides from Sails constructor', function () {
    assert.equal(overrides.test, 1);
    assert.equal(config.test, 1);
  });

  it('should merge in new overrides on reload', function () {
    overrides.test = 2;
    config.reload();
    assert.equal(config.test, 2);
  });

  it('should merge in new defaults on reload', function () {
    overrides.test = undefined;
    defaults.test = 3
    config.reload();
    assert.equal(config.test, 3);
  });

  it('should remove undefined keys on reload', function () {
    assert.equal(config.test, 1);
    delete overrides.test
    config.reload();
    assert.equal(config.test, undefined);
  });

  it('should allow watching config keys for changes', function (done) {
    config.watch('test', function () {
      assert.equal(config.test, 2);
      done();
    });
    overrides.test = 2;
    config.reload();
  });

  it('should emit events for deep changes by default', function (done) {
    overrides.test = {one: {two: 2}};
    config.watch('test', function () {
      assert.equal(config.test.one.two, 3);
      done();
    });
    overrides.test.one.two = 3;
    config.reload();
  });

  it('should emit events for cors changes by default', function (done) {
    assert.equal(config.cors.allRoutes, false);
    overrides.cors = {allRoutes: true};
    config.watch('cors', function () {
      assert.equal(config.cors.allRoutes, true);
      done();
    });
    config.reload();
  });

  xit('should not emit events for changes deeper than specified level', function (done) {
    overrides.test = {one: {two: 2}};
    config.reload();
    var watched = false;
    config.watch('test', function () {
      watched = true;
    }, 1);
    overrides.test.one.two = 3;
    config.reload();
    setTimeout(function () {
      assert.ok(!watched);
      done();
    }, 100);
  });

  xit('should emit events for changes below specified level', function (done) {
    overrides.test = {one: {two: 2}};
    config.reload();
    var watched = false;
    config.watch('test', function () {
      watched = true;
    }, 2);
    overrides.test.one.two = 3;
    config.reload();
    setTimeout(function () {
      assert.ok(watched);
      done();
    }, 100);
  });

  it('should emit events for new keys by default when watching entire config', function (done) {
    var watched = false;
    config.watch(function () {
      watched = true;
    });
    overrides.test2 = 2;
    config.reload();
    setTimeout(function () {
      assert.ok(watched);
      done();
    }, 10);
  });

  // There's a bug in WatchJS's clone() implementation that forces all attrs to be updated.
  xit('should emit events for new keys when watching entire config if specified', function (done) {
    config.watch(function () {
      console.log(arguments);
      assert.equal(config.test2, 2);
      done();
    }, 1, true);
    overrides.test2 = 2;
    config.reload();
  });

  it('should emit events for new keys when watching specific key by default', function (done) {
    config.watch('test2', function () {
      assert.equal(config.test2, 2);
      done();
    });
    overrides.test2 = 2;
    config.reload();
  });
});
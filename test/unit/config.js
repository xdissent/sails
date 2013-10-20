var should = require('should'),
  sinon = require('sinon'),
  Sails = require('../../src'),
  sails = new Sails(),
  config = null,
  mocks = null;

describe('config', function () {

  beforeEach(function () {
    mocks = {
      overrides: {
        testing: 123
      },
      defaults: {
        paths: {
          config: '/dev/null'
        }
      },
      moduleLoader: {
        aggregate: sinon.stub()
      },
      environment: 'test',
      watcher: sinon.spy()
    };

    mocks.watcher.close = sinon.spy();
    
    config = sails.container.get('config', mocks);
  });

  it('should merge in overrides from Sails constructor', function () {
    config.testing.should.equal(123);
  });

  it('should merge in defaults', function () {
    config.paths.config.should.equal('/dev/null');
  });

  it('should watch file system for changes', function () {
    mocks.watcher.calledOnce.should.equal.true;
    mocks.watcher.args[0][0].should.equal('/dev/null');
  });

  it('should reload config when file system changes', function () {
    mocks.watcher.calledOnce.should.equal.true;
    mocks.overrides.testing = 5;
    mocks.watcher.args[0][1]();
    config.testing.should.equal(5);
  });

  it('should load user config files', function () {
    var called = false;
    mocks.moduleLoader.aggregate = function (opts, cb) {
      if (called) return cb(null, {});
      called = true;
      cb(null, {user: 'xxx'});
    };
    config = sails.container.get('config', mocks);
    config.should.have.property('user');
    config.user.should.equal('xxx');
  });

  it('should load local user config file', function () {
    var called = false;
    mocks.moduleLoader.aggregate = function (opts, cb) {
      if (called) return cb(null, {local: 'yyy'});
      called = true;
      cb(null, {});
    };
    config = sails.container.get('config', mocks);
    config.should.have.property('local');
    config.local.should.equal('yyy');
  });

  it('should override defaults with user config', function () {
    var called = false;
    mocks.moduleLoader.aggregate = function (opts, cb) {
      if (called) return cb(null, {});
      called = true;
      cb(null, {user: 'xxx'});
    };
    mocks.defaults.user = 'yyy';
    config = sails.container.get('config', mocks);
    config.user.should.equal('xxx');
  });

  it('should override user config with locals', function () {
    var called = false;
    mocks.moduleLoader.aggregate = function (opts, cb) {
      if (called) return cb(null, {user: 'zzz'});
      called = true;
      cb(null, {user: 'xxx'});
    };
    config = sails.container.get('config', mocks);
    config.user.should.equal('zzz');
  });

  it('should override config with local environment config', function () {
    var called = false;
    mocks.moduleLoader.aggregate = function (opts, cb) {
      if (called) return cb(null, {user: 'yyy', test: {user: 'zzz'}});
      called = true;
      cb(null, {user: 'xxx'});
    };
    config = sails.container.get('config', mocks);
    config.user.should.equal('zzz');
  });

  it('should override user config with overrides', function () {
    var called = false;
    mocks.moduleLoader.aggregate = function (opts, cb) {
      if (called) return cb(null, {});
      called = true;
      cb(null, {testing: 111});
    };
    config = sails.container.get('config', mocks);
    config.testing.should.equal(123);
  });

  it('should override local config with overrides', function () {
    var called = false;
    mocks.moduleLoader.aggregate = function (opts, cb) {
      if (called) return cb(null, {testing: 321});
      called = true;
      cb(null, {});
    };
    config = sails.container.get('config', mocks);
    config.testing.should.equal(123);
  });

  it('should override local environment config with overrides', function () {
    var called = false;
    mocks.moduleLoader.aggregate = function (opts, cb) {
      if (called) return cb(null, {test: {testing: 321}});
      called = true;
      cb(null, {});
    };
    config = sails.container.get('config', mocks);
    config.testing.should.equal(123);
  });

  describe('reload', function () {

    it('should merge in new overrides on reload', function () {
      mocks.overrides.testing = 2;
      config.reload();
      config.testing.should.equal(2);
    });

    it('should merge in new defaults on reload', function () {
      mocks.overrides.testing = undefined;
      mocks.defaults.testing = 3;
      config.reload();
      config.testing.should.equal(3);
    });

    it('should remove undefined keys on reload', function () {
      config.testing.should.equal(123);
      delete mocks.overrides.testing;
      config.reload();
      config.should.not.have.property('testing');
    });
  });

  describe('watch', function () {
  
    it('should allow watching config keys for changes', function (done) {
      config.watch('testing', function () {
        config.testing.should.equal(2);
        done();
      });
      mocks.overrides.testing = 2;
      config.reload();
    });

    it('should emit events for deep changes by default', function (done) {
      mocks.overrides.testing = {one: {two: 2}};
      config.watch('testing', function () {
        config.testing.one.two.should.equal(3);
        done();
      });
      mocks.overrides.testing.one.two = 3;
      config.reload();
    });

    xit('should not emit events for changes deeper than specified level', function (done) {
      mocks.overrides.testing = {one: {two: 2}};
      config.reload();
      var watched = false;
      config.watch('testing', function () {
        watched = true;
      }, 1);
      mocks.overrides.testing.one.two = 3;
      config.reload();
      setTimeout(function () {
        watched.should.equal.false;
        done();
      }, 100);
    });

    xit('should emit events for changes below specified level', function (done) {
      mocks.overrides.testing = {one: {two: 2}};
      config.reload();
      var watched = false;
      config.watch('testing', function () {
        watched = true;
      }, 2);
      mocks.overrides.testing.one.two = 3;
      config.reload();
      setTimeout(function () {
        watched.should.equal.true;
        done();
      }, 100);
    });

    it('should emit events for new keys by default when watching entire config', function (done) {
      var watched = false;
      config.watch(function () {
        watched = true;
      });
      mocks.overrides.test2 = 2;
      config.reload();
      setTimeout(function () {
        watched.should.equal.true;
        done();
      }, 10);
    });

    xit('should emit events for new keys when watching entire config if specified', function (done) {
      config.watch(function () {
        config.test2.should.equal(2);
        done();
      }, 1, true);
      mocks.overrides.test2 = 2;
      config.reload();
    });

    it('should emit events for new keys when watching specific key by default', function (done) {
      config.watch('test2', function () {
        config.test2.should.equal(2);
        done();
      });
      mocks.overrides.test2 = 2;
      config.reload();
    });
  });
});
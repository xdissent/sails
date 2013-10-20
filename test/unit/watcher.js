var should = require('should'),
  sinon = require('sinon'),
  chokidar = require('chokidar'),
  events = require('events'),
  Sails = require('../../src'),
  sails = new Sails(),
  watcher = null,
  emitter = null,
  mocks = null;

describe('watcher', function () {

  beforeEach(function () {

    emitter = new events.EventEmitter();

    sinon.stub(chokidar, 'watch').returns(emitter);;

    mocks = {
      config: {
        watcher: {timeout: 250, maxTimeout: 1000},
        log: {level: 'verbose'}
      }
    };

    watcher = sails.container.get('watcher', mocks);
  });

  afterEach(function () {
    chokidar.watch.restore();
  });

  it('should should be a function', function () {
    watcher.should.be.a.Function;
  });

  it('should call chokidar watch with given file', function () {
    watcher('/dev/null', function () {});
    chokidar.watch.calledOnce.should.be.true;
    chokidar.watch.args[0].should.have.lengthOf(2);
    chokidar.watch.args[0][0].should.equal('/dev/null');
  });

  it('should call the callback when a file changes', function (done) {
    var watched = function (files) {
      should.exist(files);
      files.should.be.an.Array;
      files.should.have.lengthOf(1);
      files[0].should.equal('/dev/null');
      done();
    };
    watcher('/dev/null', watched);
    emitter.emit('all', 'file', '/dev/null', {});
  });

  it('should call the callback after max timeout even if changes persist', function (done) {
    var interval, start = new Date();

    var watched = function (files) {
      clearInterval(interval);
      should.exist(files);
      files.should.be.an.Array;
      files.should.have.lengthOf(1);
      files[0].should.equal('/dev/null');
      var duration = new Date() - start;
      duration.should.be.greaterThan(mocks.config.watcher.maxTimeout);
      duration.should.be.lessThan(mocks.config.watcher.maxTimeout + mocks.config.watcher.timeout);
      done();
    };

    watcher('/dev/null', watched);

    interval = setInterval(function () {
      emitter.emit('all', 'file', '/dev/null', {});
    }, mocks.config.watcher.timeout / 2);
  });
});
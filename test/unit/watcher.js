var Sails = require('../../src'),
  assert = require('assert'),
  tmp = require('tmp'),
  fs = require('fs'),
  path = require('path'),
  sails = null, watcher = null, appPath = null;

describe('watcher', function () {

  beforeEach(function (done) {
    tmp.dir(function (err, dir) {
      if (err) return done(err);
      appPath = dir;
      sails = new Sails({appPath: appPath, hooks: []});
      sails.container.get('watcher', function (err, result) {
        if (err) return done(err);
        watcher = result;
        done();
      });
    });
  });

  function expect (watches, pattern, callback, done) {
    var watched = 0;
    watcher(appPath, pattern, function() {
      watched++;
    });
    setTimeout(callback, 1000);
    setTimeout(function () {
      assert.equal(watched, watches);
      done();
    }, 2000);
  }

  it('should watch file additions', function (done) {
    expect(1, null, function () {
      fs.writeFileSync(path.join(appPath, 'tmp'), 'tmp');
    }, done);
  });

  it('should watch file changes', function (done) {
    fs.writeFileSync(path.join(appPath, 'tmp'), 'tmp');
    expect(1, null, function () {
      fs.writeFileSync(path.join(appPath, 'tmp'), 'xxx');
    }, done);
  });

  it('should watch file removal', function (done) {
    fs.writeFileSync(path.join(appPath, 'tmp'), 'tmp');
    expect(1, null, function () {
      fs.unlinkSync(path.join(appPath, 'tmp'));
    }, done);
  });

  it('should watch file renames', function (done) {
    fs.writeFileSync(path.join(appPath, 'tmp'), 'tmp');
    expect(1, null, function () {
      fs.renameSync(path.join(appPath, 'tmp'), path.join(appPath, 'xxx'));
    }, done);
  });

  it('should not watch dir additions', function (done) {
    expect(0, null, function () {
      fs.mkdirSync(path.join(appPath, 'tmp'));
    }, done);
  });

  it('should emit a single event for a group of file additions', function (done) {
    expect(1, null, function () {
      fs.writeFileSync(path.join(appPath, 'tmp0'), 'tmp');
      fs.writeFileSync(path.join(appPath, 'tmp1'), 'tmp');
      fs.writeFileSync(path.join(appPath, 'tmp2'), 'tmp');
    }, done);
  });

  it('should emit a single event for a group of file changes', function (done) {
    fs.writeFileSync(path.join(appPath, 'tmp0'), 'tmp');
    fs.writeFileSync(path.join(appPath, 'tmp1'), 'tmp');
    fs.writeFileSync(path.join(appPath, 'tmp2'), 'tmp');
    expect(1, null, function () {
      fs.writeFileSync(path.join(appPath, 'tmp0'), 'xxx');
      fs.writeFileSync(path.join(appPath, 'tmp1'), 'xxx');
      fs.writeFileSync(path.join(appPath, 'tmp2'), 'xxx');
    }, done);
  });

  it('should emit a single event for a group of file removals', function (done) {
    fs.writeFileSync(path.join(appPath, 'tmp0'), 'tmp');
    fs.writeFileSync(path.join(appPath, 'tmp1'), 'tmp');
    fs.writeFileSync(path.join(appPath, 'tmp2'), 'tmp');
    expect(1, null, function () {
      fs.unlinkSync(path.join(appPath, 'tmp0'));
      fs.unlinkSync(path.join(appPath, 'tmp1'));
      fs.unlinkSync(path.join(appPath, 'tmp2'));
    }, done);
  });

  it('should emit a single event for a group of file renames', function (done) {
    fs.writeFileSync(path.join(appPath, 'tmp0'), 'tmp');
    fs.writeFileSync(path.join(appPath, 'tmp1'), 'tmp');
    fs.writeFileSync(path.join(appPath, 'tmp2'), 'tmp');
    expect(1, null, function () {
      fs.renameSync(path.join(appPath, 'tmp0'), path.join(appPath, 'xxx0'));
      fs.renameSync(path.join(appPath, 'tmp1'), path.join(appPath, 'xxx1'));
      fs.renameSync(path.join(appPath, 'tmp2'), path.join(appPath, 'xxx2'));
    }, done);
  });

  it('should emit events for files matching pattern', function (done) {
    expect(1, /tmp/, function () {
      fs.writeFileSync(path.join(appPath, 'tmp'), 'tmp');
    }, done);
  });

  it('should not emit events for files not matching pattern', function (done) {
    expect(0, /xxx/, function () {
      fs.writeFileSync(path.join(appPath, 'tmp'), 'tmp');
    }, done);
  });
});
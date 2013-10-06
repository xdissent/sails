  var path = require('path'),
    fs = require('fs'),
    glob = require('glob'),
    async = require('async'),
    _ = require('lodash'),
    child_process = require('child_process'),
    existsSync = fs.existsSync || path.existsSync;

module.exports = function (config, log, watcher, done) {

  log = log.namespace('grunt');

  function Grunt () {
    var self = this;
    config.watch('grunt', function () {
      log.verbose('Config changed');
      self.reload(function () {});
    });
    this.reload(done);
  }

  Grunt.prototype.unload = function (cb) {
    log.verbose('Unloading');
    if (!this._child) return cb(null, this);
    var self = this,
      callback = function () {
        log.verbose('Child was killed');
        self._child.removeAllListeners();
        self._child = null;
        cb(null, self);
      };
    self._child.removeAllListeners();
    self._child.on('error', callback);
    self._child.on('exit', callback);
    self._child.on('close', callback);
    self._child.kill();
  };

  Grunt.prototype.reload = function(cb) {
    log.verbose('Reloading');
    var self = this;
    this.unload(function (err) {
      if (err) return cb(err);
      self.load(cb);
    });
  };

  Grunt.prototype.load = function (cb) {
    log.verbose('Loading');

    var options = _.clone(config.grunt),
      self = this;

    if (_.isUndefined(options.gruntfile)) {
      var globPath = path.join(config.paths.app, 'Gruntfile.{js,coffee}');
      options.gruntfile = glob.sync(globPath)[0];
    }

    if (!options.gruntfile || !existsSync(options.gruntfile) || _.isEmpty(options.tasks)) {
      log.verbose('No gruntfile - skipping');
      return cb(null, this);
    }

    log.verbose('Forking');
    this._child = child_process.fork(path.resolve(__dirname, '_grunt.js'), {cwd: config.paths.app});

    var callback = function () {
        log.error('Child died');
        self._child.removeAllListeners();
        self._child = null;
        cb(null, self);
      };
    this._child.on('error', callback);
    this._child.on('exit', callback);
    this._child.on('close', callback);

    this._child.on('message', function (msg) {
      self._child.removeAllListeners();

      switch (msg) {
        case 'watching':
          log.verbose('Watching');
          var callback = function () {
            log.error('Child stopped watching');
            self._child.removeAllListeners();
            self.unload(function () {});
          };
          self._child.on('error', callback);
          self._child.on('exit', callback);
          self._child.on('close', callback);
          cb(null, self);
          break;
        case 'done':
          log.verbose('Complete');
          self.unload(cb);
          break;
        default:
          log.error('Error', msg);
          self.unload(cb);
          break;
      }
    });

    this._watch(options.gruntfile);
    this._child.send(options);
  };

  Grunt.prototype._watch = function(file) {
    if (this._watcher) {
      this._watcher.close();
    }
    var self = this;
    this._watcher = watcher(file, function () {
      log.verbose('Gruntfile changed');
      self.reload(function () {});
    });
  };

  return new Grunt();
};
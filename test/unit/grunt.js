  var grunt = require('grunt'),
    path = require('path'),
    glob = require('glob'),
    async = require('async'),
    _ = require('lodash');

module.exports = function (config, log, done) {

  log = log.namespace('grunt');
  config.watch('grunt', function () {
    loadGrunt(function (err) {
      if (err) throw err;
    });
  });
  loadGrunt(done);

  function loadGrunt (cb) {
    var options = _.clone(config.grunt),
      error = null, done = false, watching = false;

    if (_.isUndefined(options.gruntfile)) {
      var globPath = path.join(config.paths.app, 'Gruntfile.{js,coffee}');
      options.gruntfile = glob.sync(globPath)[0];
    }

    if (!options.gruntfile || !grunt.file.exists(options.gruntfile) || _.isEmpty(options.tasks)) {
      return cb(null, grunt);
    }

    grunt.task.init(options.tasks, options);

    grunt.task.options({
      error: function gruntError (err) {
        error = err;
      },
      done: function gruntDone () {
        done = true;
      }
    });

    _.each(options.tasks, function (task) {
      grunt.task.run(task);
    });

    grunt.task.start();
    
    async.until(function () {
      return error || done || watching;
    }, function (callback) {
      if (error) {
        return callback(error);
      }
      if (!watching) {
        watching = grunt.task.current && grunt.task.current.name === 'watch';
      }
      setTimeout(callback, 100);
    }, function (err) {
      if (err) {
        log.error('Grunt Error', err);
      } else if (watching) {
        log.verbose('Grunt Watching');
      } else {
        log.verbose('Grunt Complete');
      }
      cb(err, grunt);
    });
  }
};
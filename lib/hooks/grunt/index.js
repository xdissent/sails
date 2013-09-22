module.exports = function (sails) {

  var grunt = require('grunt'),
    path = require('path'),
    glob = require('glob'),
    async = require('async'),
    util = require('../../util');

  return {
    initialize: function (cb) {
      var options = util.clone(sails.config.grunt),
        self = this, error = null, done = false, watching = false;

      if (util.isUndefined(options.tasks)) {
        options.tasks = sails.config.environment === 'production' ? ['prod'] : ['default'];
      }

      if (util.isUndefined(options.gruntfile)) {
        var globPath = path.join(sails.config.paths.app, 'Gruntfile.{js,coffee}');
        options.gruntfile = glob.sync(globPath)[0];
      }

      if (!options.gruntfile || !grunt.file.exists(options.gruntfile) || util.isEmpty(options.tasks)) {
        return cb();
      }

      self.ready = false;

      grunt.task.init(options.tasks, options);

      grunt.task.options({
        error: function gruntError (err) {
          error = err;
          sails.log.error('Grunt Error', err);
        },
        done: function gruntDone () {
          done = true;
        }
      });

      util.each(options.tasks, function (task) {
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
        self.ready = true;
      });

      cb();
    }
  };
};

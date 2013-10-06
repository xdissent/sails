var grunt = require('grunt'),
  async = require('async');

process.argv[1] = require.resolve('grunt-cli/bin/grunt');

process.on('message', function (options) {
  var result = false;

  grunt.task.init(options.tasks, options);

  grunt.task.options({
    error: function gruntError (err) {
      result = err.toString();
    },
    done: function gruntDone () {
      result = 'done';
    }
  });

  options.tasks.forEach(function (task) {
    grunt.task.run(task);
  });

  grunt.task.start();
  
  async.until(function () {
    return result;
  }, function (callback) {
    if (!result && grunt.task.current && grunt.task.current.name === 'watch') {
      result = 'watching';
    }
    setTimeout(callback, 50);
  }, function (err) {
    process.send(result);
  });
});
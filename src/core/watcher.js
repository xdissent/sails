var path = require('path'),
  chokidar = require('chokidar'),
  _ = require('lodash')
  async = require('async');

module.exports = function (config) {
  return watcher;

  function watcher (file, pattern, callback) {
    var args = _.clone(arguments);
    file = path.resolve(config.paths.app, _.find(args, _.isString));
    pattern = _.find(args, _.isRegExp) || /.*/;
    callback = _.find(args, _.isFunction) || function () {};

    var watch = chokidar.watch(file, {ignoreInitial: true}),
      watchTimeout = null,
      watchTime = null,
      files = [];

    watch.on('all', function (type, file, stat) {

      if (!config.watcher) return;
      if (!pattern.test(file)) return;
      if (!_.contains(files, file)) files.push(file);

      clearTimeout(watchTimeout);
      watchTime = watchTime || new Date();

      if (watchTime - new Date() >= config.watcher.maxTimeout) return watched();

      watchTimeout = setTimeout(watched, config.watcher.timeout);

      function watched () {
        clearTimeout(watchTimeout);
        watchTimeout = null;
        watchTime = null;
        callback(files);
      }
    });
  }
};
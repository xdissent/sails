var path = require('path'),
  chokidar = require('chokidar'),
  _ = require('lodash');

module.exports = function (_container) {
  return watcher;

  function watcher (file, pattern, callback) {
    var args = _.clone(arguments);
    file = _.find(args, _.isString);
    pattern = _.find(args, _.isRegExp) || /.*/;
    callback = _.find(args, _.isFunction) || function () {};

    var watch = chokidar.watch(file, {ignoreInitial: true}),
      watchTimeout = null,
      watchTime = null,
      files = [];

    watch.on('all', function (type, file, stat) {
      var config = _container.get('config');
      var log = _container.get('log');

      if (config.watcher === false) return;
      if (!pattern.test(file)) return;
      if (!_.contains(files, file)) files.push(file);

      var maxTimeout = config.watcher.maxTimeout || 1000,
        timeout = config.watcher.timeout || 250;

      clearTimeout(watchTimeout);
      watchTime = watchTime || new Date();

      if (new Date() - watchTime >= maxTimeout) return watched();

      watchTimeout = setTimeout(watched, timeout);

      function watched () {
        clearTimeout(watchTimeout);
        watchTimeout = null;
        watchTime = null;
        callback(files);
      }
    });
  }
};
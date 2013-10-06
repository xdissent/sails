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
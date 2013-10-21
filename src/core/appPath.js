var fs = require('fs'),
  existsSync = fs.existsSync || require('path').existsSync;

module.exports = function (overrides) {
  var appPath = overrides.appPath || (overrides.paths && overrides.paths.app) || process.cwd();
  if (!existsSync(appPath)) throw new Error('App path does not exist');
  stats = fs.statSync(appPath);
  if (!stats.isDirectory) throw new Error('App path is not a directory');
  if (fs.readdirSync(appPath).length === 0) {
    throw new Error('App path is empty');
  }
  return appPath;
};
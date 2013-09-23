module.exports = function (overrides) {
  return overrides.appPath || (overrides.paths && overrides.paths.app) || process.cwd();
};
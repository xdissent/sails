var pkg = require('../../package.json'),
  logger = require('../../lib/logger'),
  Logger = logger(pkg);

module.exports = function (config) {
  return new Logger(config.log);
};
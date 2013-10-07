var Sails = require('../'),
  path = require('path'),
  _ = require('lodash'),
  util = require('./util');

module.exports = function (program) {
  program
    .command('routes')
    .description('Display all routes')
    .action(function (opts) {

      var sails = new Sails({
          environment: program.environment,
          appPath: path.resolve(program.app || '.'),
          log: {level: program.verbose ? 'verbose' : undefined}
        });

      sails.boot(function (err) {
        if (err) throw err;
        var routes = _.map(sails.router.routes, function (route) {
          return [
            (route.name || ''),
            route.method,
            route.route,
            targetName(route.target)
          ];
        });
        console.log(util.columnize(['NAME', 'METHOD', 'ROUTE', 'TARGET'], routes));
      });
    });
};

function targetName (target) {
  if (target && target.target) return JSON.stringify(target.target);
  if (_.isFunction(target)) return target.name || 'anonymous';
  if (_.isArray(target)) return '[' + _.map(target, targetName).join(', ') + ']';
  return 'anonymous';
}
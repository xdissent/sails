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
          policies: {'*': 'test'},
          routes: {
            '/': 'home.index',
            '/view': 'home/index'
          },
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
              route.path,
              targetName(route.target)
            ];
          }),
          filters = _.map(sails.router.filters, function (filter) {
            return filter.name || 'anonymous';
          });

        console.log(util.columnize(['NAME', 'METHOD', 'ROUTE', 'TARGET'], routes), '\n');
        console.log('FILTERS:', filters, '\n');
      });
    });
};

function targetName (target) {
  if (target && target.target) return JSON.stringify(target.target);
  if (_.isFunction(target)) {
    if (target.toString().slice(0, 8) !== 'function') return target.toString();
    if (target.name) return '[Function: ' + target.name + ']';
    return '[Function]';
  }
  if (_.isArray(target)) return '[' + _.map(target, targetName).join(', ') + ']';
  return 'INVALID';
}
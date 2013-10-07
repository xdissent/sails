var Sails = require('../'),
  path = require('path'),
  _ = require('lodash');

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

        var pads = longest(routes);

        console.log(_.map(routes, function (route) {
          return _.map(route, function (col, num) {
            return pad(col, pads[num]);
          }).join('\t');
        }).join('\n'));
      });
    });
};

function targetName (target) {
  if (target && target.target) return JSON.stringify(target.target);
  if (_.isFunction(target)) return target.name || 'anonymous';
  if (_.isArray(target)) return '[' + _.map(target, targetName).join(', ') + ']';
  return 'anonymous';
}

function longest (rows) {
  return _.reduce(rows, function (lengths, row) {
    _.each(row, function (col, num) {
      lengths[num] = Math.max(col.length, lengths[num] || 0);
    });
    return lengths;
  }, Array(rows.length));
}

function pad (str, width) {
  var len = Math.max(0, width - str.length);
  return str + Array(len + 1).join(' ');
}
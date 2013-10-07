var Sails = require('../'),
  path = require('path'),
  _ = require('lodash');

module.exports = function (program) {
  program
    .command('middleware')
    .description('Display all middleware')
    .action(function (opts) {

      var sails = new Sails({
          environment: program.environment,
          appPath: path.resolve(program.app || '.'),
          log: {level: program.verbose ? 'verbose' : undefined}
        });

      sails.boot(function (err) {
        if (err) throw err;

        var middlewares = _.map(sails.http.stack, function (middleware) {
          return [
            middleware.route,
            (middleware.handle.name || 'anonymous'),
            (middleware.handle.length && middleware.handle.length > 3 && '(error)' || '')
          ];
        });

        var pads = longest(middlewares);

        console.log(_.map(middlewares, function (middleware) {
          return _.map(middleware, function (col, num) {
            return pad(col, pads[num]);
          }).join('\t');
        }).join('\n'));
      });
    });
};

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
var Sails = require('../'),
  path = require('path'),
  _ = require('lodash'),
  util = require('./util');

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

        var middlewares = _.map(sails.http.stack, function (middleware, index) {
          return [
            index,
            (middleware.handle.name || 'anonymous'),
            middleware.route,
            (middleware.handle.length && middleware.handle.length > 3 && '*' || '')
          ];
        });
        console.log(util.columnize(['#', 'NAME', 'ROUTE', 'ERR'], middlewares));
      });
    });
};
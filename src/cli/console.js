var Sails = require('../'),
  path = require('path');

module.exports = function (program) {
  program
    .command('console')
    .description('Run the Sails console')
    .option('-c, --coffee', 'Use CoffeeScript console')
    .action(function (opts) {

      var sails = new Sails({
          environment: program.environment,
          appPath: path.resolve(program.app || '.'),
          log: {level: program.verbose ? 'verbose' : undefined}
        }),
        prompt = 'sails (' + sails.environment + ')> ',
        repl = opts.coffee ? require('coffee-script/lib/coffee-script/repl') : require('repl');

      repl.start({prompt: prompt}).on('exit', function () {
        sails.server.close();
        process.exit();
      });
    });
};
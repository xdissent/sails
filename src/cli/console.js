var Sails = require('../');

module.exports = function (program) {
  program
    .command('console')
    .description('run teh sails console')
    .option('--dev', 'Use development environment')
    .option('--prod', 'Use production environment')
    .option('-e, --environment <env>', 'Set environment')
    .action(function (command) {
      var overrides = {};
      if (command.dev) overrides.dev = true;
      if (command.prod) overrides.prod = true;
      if (command.environment) overrides.environment = command.environment;

      global.sails = new Sails(overrides);

      var server = sails.container.get('server'),
        env = sails.container.get('environment'),
        repl = require('repl').start('sails (' + env + ')> ');

      repl.on('exit', function () {
        server.close();
        process.exit();
      });
    });
};
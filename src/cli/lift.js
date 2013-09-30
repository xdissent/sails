var Sails = require('../');

module.exports = function (program) {
  program
    .command('lift')
    .description('run teh sails lift')
    .option('--dev', 'Use development environment')
    .option('--prod', 'Use production environment')
    .option('-e, --environment <env>', 'Set environment')
    .action(function (command) {
      var overrides = {};
      if (command.dev) overrides.dev = true;
      if (command.prod) overrides.prod = true;
      if (command.environment) overrides.environment = command.environment;

      var sails = new Sails(overrides);
      sails.lift();
    });
};
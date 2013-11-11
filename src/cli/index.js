var _ = require('lodash'),
  program = require('commander'),
  pkg = require('../../package.json'),
  environment = null,
  subcommands = [
    'new',
    'lift',
    'console',
    'routes',
    'middleware',
    'generate'
  ];

function checkAmbiguous (env) {
  if (environment && environment !== env) {
    throw new Error('Ambiguous environment specified');
  }
}

function validateEnv () {
  checkAmbiguous(program.environment);
  environment = program.environment;
}

function validateEnvFlag (env) {
  return function () {
    if (program.prod && program.dev) {
      throw new Error('Cannot use --prod and --dev simultaneously');
    }
    var fullEnv = env === 'prod' ? 'production' : 'development';
    checkAmbiguous(fullEnv);
    environment = program.environment = fullEnv;
  };
}

program.Command.prototype._commandHelp = program.Command.prototype.commandHelp;
program.Command.prototype.commandHelp = function () {
  _.each(this.commands, function (command) {
    command._name = command._name[0] + '[' + command._name.slice(1) + ']';
  });
  return program.Command.prototype._commandHelp.apply(this, arguments);
};

program
  .version(pkg.version)
  .option('-a, --app <path>', 'Path to Sails app [cwd]', process.cwd())
  .option('-e, --environment <env>', 'Use specified environment [development]', 'development')
  .option('--dev', 'Use development environment')
  .option('--prod', 'Use production environment')
  .option('-v, --verbose', 'Enable verbose logging')
  .on('dev', validateEnvFlag('dev'))
  .on('prod', validateEnvFlag('prod'))
  .on('environment', validateEnv)
  .on('*', function (args) {
    // Generate shortcuts
    var command = args[0];
    if (!_.isEmpty(command)) {
      var subcommand = _.find(subcommands, function (subcommand) {
        return subcommand.slice(0, command.length) === command;
      });
      if (subcommand) {
        return program.parse(_.map(program.rawArgs, function (arg) {
          return arg === command ? subcommand : arg;
        }));
      }
    }
    program.help();
  });

_.each(subcommands, function (subcommand) {
  require('./' + subcommand)(program);
});

module.exports = function cli () {
  program.parse.apply(program, arguments);

  if (program.rawArgs.length == 2) program.help();
};
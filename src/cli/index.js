var _ = require('lodash'),
  program = require('commander'),
  pkg = require('../../package.json'),
  environment = null,
  subcommands = [
    'new',
    'generate',
    'lift',
    'console'
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

program
  .version(pkg.version)
  .option('-a, --app <path>', 'Path to Sails app [cwd]', process.cwd())
  .option('-e, --environment <env>', 'Use specified environment [development]', 'development')
  .option('--dev', 'Use development environment')
  .option('--prod', 'Use production environment')
  .option('-v, --verbose', 'Enable verbose logging')
  .on('dev', validateEnvFlag('dev'))
  .on('prod', validateEnvFlag('prod'))
  .on('environment', validateEnv);

_.each(subcommands, function (subcommand) {
  require('./' + subcommand)(program);
});

module.exports = function cli () {
  program.parse.apply(program, arguments);
  if (!program.args.length) program.help();
};
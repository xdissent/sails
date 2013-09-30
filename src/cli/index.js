var _ = require('lodash'),
  program = require('commander'),
  pkg = require('../../package.json'),
  subcommands = [
    'new',
    'generate',
    'lift',
    'console'
  ];

program.version(pkg.version);
_.each(subcommands, function (subcommand) {
  require('./' + subcommand)(program);
});

module.exports = function cli () {
  program.parse.apply(program, arguments);
};
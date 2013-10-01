var _ = require('lodash');

module.exports = function generate (program) {
  program
    .command('generate [type] <name> [attributes...]')
    .description('run teh sails generate')
    .action(function (type, name, attributes, opts) {
      console.log(opts.parent.rawArgs.slice(3));
    });
};
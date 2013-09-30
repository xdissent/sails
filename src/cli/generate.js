module.exports = function generate (program) {
  program
    .command('generate [names]')
    .description('run teh sails generate')
    .option('-X, --no-reuse-xp', 'Do not reuse the XP VM for IE7 and IE8')
    .option('-7, --no-reuse-7', 'Do not reuse the Win7 VM for IE10 and IE11')
    .option('-s, --shrink', 'Shrink the virtual machines after installing')
    .action(function (names, command) {
      console.log('GENERATE', names);
    });
};
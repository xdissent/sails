module.exports = function (program) {
  program
    .command('new [names]')
    .description('run teh sails new')
    .option('-X, --no-reuse-xp', 'Do not reuse the XP VM for IE7 and IE8')
    .option('-7, --no-reuse-7', 'Do not reuse the Win7 VM for IE10 and IE11')
    .option('-s, --shrink', 'Shrink the virtual machines after installing')
    .action(function (names, command) {
      console.log('NEW', names);
    });
};
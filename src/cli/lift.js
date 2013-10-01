var Sails = require('../'),
  path = require('path');

module.exports = function (program) {
  program
    .command('lift')
    .description('Start the Sails server')
    .action(function () {

      var sails = new Sails({
          environment: program.environment,
          appPath: path.resolve(program.app || '.'),
          log: {level: program.verbose ? 'verbose' : undefined}
        }),
        cfg = sails.config,
        usingSSL = cfg.server && cfg.server.key && cfg.server.cert,
        url = (usingSSL ? 'https' : 'http') + '://' + cfg.server.host + ':' + cfg.server.port;

      sails.lift(function () {
        sails.log.ship();
        sails.log.info('Server lifted in `' + sails.appPath + '`');
        sails.log.info('To see your app, visit ' + url);
        sails.log.info('To shut down Sails, press <CTRL> + C at any time.');
        sails.log('--------------------------------------------------------');
        sails.log(':: ' + new Date());
        sails.log();
        sails.log('Environment\t: ' + sails.environment);
        sails.log('Host\t\t: ' + cfg.server.host);
        sails.log('Port\t\t: ' + cfg.server.port);
        sails.log('--------------------------------------------------------');
      });

    });
};
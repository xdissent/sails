var _ = require('lodash'),
  path = require('path'),
  generate = require('../../bin/generate');

module.exports = function (program) {
  program
    .command('generate <type> [name] [attributes...]')
    .description('run teh sails generate')
    .option('-c, --coffee', 'Use CoffeeScript generators')
    .option('-f, --federated', 'Generate federated controller')
    .action(function (type, name, attributes, opts) {

      var types = ['model', 'controller', 'view', 'adapter'],
        sails = new Sails({
          environment: program.environment,
          appPath: path.resolve(program.app || '.'),
          log: {level: program.verbose ? 'verbose' : undefined}
        }),
        generator = generate(sails);

      attributes = _.reject(opts.parent.rawArgs.slice(5), function (a) {
        return a[0] === '-';
      });

      if (!_.contains(types, type)) {
        attributes.unshift(name);
        name = type;
        type = null;
      }

      if (!name) throw new Error('Name is required');

      var ext = opts.coffee ? 'coffee' : 'js',
        options;

      switch (type) {

        case 'view':
          options = {actions: attributes, ext: ext};
          generator.generateView(name, options);
          sails.log.info('Generated view for ' + name);
          break;

        case 'adapter':
          generator.generateAdapter(name, {ext: ext});
          sails.log.info('Generated adapter for ' + name);
          break;

        default:
          if (!type || type === 'model') {
            options = {
              ext: ext,
              attributes: _.compact(_.map(attributes, function (attr) {
                if (!_.isString(attr)) return null;
                var pieces = attr.split(':');
                return {name: pieces[0], type: pieces[1] || 'string'};
              }))
            };
            generator.generateModel(name, options);
            sails.log.info('Generated model for ' + name);
          }

          if (!type || type === 'controller') {
            options = {
              ext: ext,
              federated: opts.federated,
              actions: !type ? [] : attributes
            };
            generator.generateController(name, options);
            sails.log.info('Generated controller for ' + name);
          }
          break;
      }
    });
};
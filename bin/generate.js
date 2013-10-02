module.exports = function (sails) {


	/**
	 * Module dependencies.
	 */

	var _			= require( 'lodash' ),
		utils		= require( './utils' )(sails),
		fs			= utils.fs,
		pluralize	= require('pluralize');


	/**
	 * Expose new instance of `Generator`
	 */

	return new Generator();


	function Generator ( ) {


		/**
		 * Generate a Sails controller file
		 *
		 * @api private
		 */

		this.generateController = function (entity, options) {
			var ext = options.ext || 'js';
			var newControllerPath = sails.config.paths.controllers + '/' + utils.capitalize(entity) + 'Controller.js';
			var newFederatedControllerPath = sails.config.paths.controllers + '/' + entity;

			utils.verifyDoesntExist(newControllerPath, 'A controller already exists at: ' + newControllerPath);
			utils.verifyDoesntExist(newFederatedControllerPath, 'A controller already exists at: ' + newFederatedControllerPath);

			// Federated controller
			if (options && (options.f || options.federated)) {

				utils.generateDir('./' + newFederatedControllerPath);
				_.each(options.actions, function(action) {

					action = utils.verifyValidEntity(action, 'Invalid action name: ' + action);

					return generate({
						boilerplate: 'federatedAction.ejs',
						prefix: sails.config.paths.controllers + '/' + entity,
						entity: entity,
						identity: entity.toLowerCase(),
						pluralIdentity: pluralize(entity),
						action: action,
						viewEngine: sails.config.views.engine,
						viewPath: require('underscore.string').rtrim(sails.config.paths.views, '/'),
						baseurl: '/' + entity,
						suffix: '.' + ext,
						ext: ext
					});
				});
			}
			// Monolithic controller
			else {
				var actions = '';
				// Add each requested function
				if (options && options.actions) {
					actions = _.map(options.actions, function(action, i) {
						return utils.renderBoilerplateTemplate('action.ejs', {
							ext: ext,
							action: action,
							entity: entity,
							viewEngine: sails.config.views.engine,
							viewPath: require('underscore.string').rtrim(sails.config.paths.views, '/'),
							baseurl: '/' + entity
						});
					}).join('\n\n');
				}
				return generate({
					boilerplate: 'controller.ejs',
					prefix: sails.config.paths.controllers,
					entity: utils.capitalize(entity),
					identity: entity.toLowerCase(),
					pluralIdentity: pluralize(entity),
					actions: actions,
					suffix: 'Controller.' + ext,
					ext: ext
				});
			}
		};



		/**
		 * Generate a Sails model file
		 *
		 * @api private
		 */

		this.generateModel = function (entity, options) {
			var attributes = '', ext = options.ext || 'js';

			// Add each requested attribute
			if (options && options.attributes) {
				attributes = _.map(options.attributes, function(attribute, i) {
					attribute.name = utils.verifyValidEntity(attribute.name, 'Invalid attribute: ' + attribute.name);

					var fnString = utils.renderBoilerplateTemplate('attribute.ejs', {
						attribute: attribute,
						entity: entity,
						viewEngine: sails.config.views.engine,
						viewPath: require('underscore.string').rtrim(sails.config.paths.views, '/'),
						baseurl: '/' + entity,
						ext: ext
					});

					// Add commas after js attributes
					if (ext === 'js' && i < options.attributes.length - 1) {
						fnString = fnString + ',';
					}
					return fnString;

				}).join('\n\n');
			}
			return generate({
				boilerplate: 'model.ejs',
				prefix: sails.config.paths.models,
				entity: utils.capitalize(entity),
				attributes: attributes,
				suffix: '.' + ext,
				ext: ext
			});
		};


		/**
		 * Generate a Sails adapter file
		 *
		 * @api private
		 */

		this.generateAdapter = function (entity, options) {
			var ext = options.ext || 'js';
			return generate({
				boilerplate: 'adapter.ejs',
				prefix: sails.config.paths.adapters,
				entity: utils.capitalize(entity),
				suffix: 'Adapter.' + ext,
				ext: ext
			});
		};


		/**
		 * Generate a Sails view file
		 * (depedent on viewEngine config)
		 *
		 * @api private
		 */

		this.generateView = function (entity, options) {
			var ext = options.ext || 'js';
			var viewPath = sails.config.paths.views + '/' + entity;
			utils.generateDir(viewPath);

			_.each(options.actions, function(action) {
				action = utils.verifyValidEntity(action, 'Invalid view name: ' + action);

				return generate({
					boilerplate: 'view.' + sails.config.views.engine,
					prefix: viewPath,
					entity: entity,
					action: action,
					suffix: '.' + sails.config.views.engine,
					ext: ext
				});
			});
		};


		/**
		 * Utility class to generate a file given the boilerplate and output paths,
		 * as well as an optional ejs render override.
		 *
		 * @api private
		 */

		function generate (options) {
			var boilerplateName = options.boilerplate.split('.')[0];
			sails.log.verbose('Generating ' + boilerplateName + ' for ' + options.entity + '...');

			// Trim slashes
			options.prefix = require('underscore.string').rtrim(options.prefix, '/') + '/';

			if (!options.entity) {
				throw new Error('No output file name specified!');
			}

			var file = utils.renderBoilerplateTemplate(options.boilerplate, options);

			var fileEntity = options.action || options.entity;
			var newFilePath = options.prefix + fileEntity + options.suffix;
			utils.verifyDoesntExist(newFilePath, 'A file or directory already exists at: ' + newFilePath);

			// Touch output file to make sure the path to it exists
			if (fs.createFileSync(newFilePath)) {
				sails.log.error('Could not create file, ' + newFilePath + '!');
				process.exit(1);
			}
			fs.writeFileSync(newFilePath, file);
		}

	}
};


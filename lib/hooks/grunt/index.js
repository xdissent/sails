module.exports = function (sails) {

	/**
	 * Module dependencies
	 */

	var FatalError = require('../../errors/fatal')(sails),
		ChildProcess = require('child_process');


	return {

		
		/**
		 * Initialize this project's Grunt tasks
		 * and execute the environment-specific gruntfile
		 *
		 */
		initialize: function (cb) {

			sails.log.verbose('Loading app Gruntfile...');

			// Start task depending on environment
			if(sails.config.environment === 'production'){
				return this.runTask('prod', cb);
			}

			this.runTask('default', cb);
		},


		/**
		 * Fork Grunt child process
		 *
		 * @param {String} taskName - grunt task to run
		 * @param {Function} cb - optional, fires when the Grunt task has been started
		 */
		runTask: function (taskName, cb_afterTaskStarted) {
			cb_afterTaskStarted = cb_afterTaskStarted || function () {};

			var environment = sails.config.environment;
			var baseurl = 'http://' + sails.config.host + ':' + sails.config.port;
			var signalpath = '/___signal';
			var pathToSails = __dirname.replace(' ', '\\ ') + '/../../..';

			if (!taskName) {
				taskName = '';
			}

			// Fork Grunt child process
			var child = 
			ChildProcess.fork(
			pathToSails + '/node_modules/grunt-cli/bin/grunt',
			[
				taskName,

				// Grunt dependency source path
				'--gdsrc=' + pathToSails + '/node_modules',

				// Environment to run in
				'--environment=' + environment,

				// The base URL of the running Sails app
				'--baseurl=' + baseurl,

				// The URL path where Grunt should send signals
				// when core files change
				'--signalpath=' + signalpath
			],
			{
				silent: true,
				stdio: 'pipe'
			});


			var errorMsg = '';
			var stackTrace = '';

			// Log output as it comes in to the appropriate log channel
			child.stdout.on('data', function (consoleMsg) {

				// store all the output
				consoleMsg = consoleMsg.toString();
				errorMsg += consoleMsg;// + '\n';

				var trimmedStackTrace = stackTrace.replace(/\n*$/,''),
					trimmedConsoleMsg = consoleMsg.replace(/\n*$/,'');

				if (consoleMsg.match(/Warning:/)) {
					// Find the Stack Trace related to this warning
					stackTrace = errorMsg.substring(errorMsg.lastIndexOf('Running "'));
					sails.log.warn('** Grunt :: Warning **');
					sails.log.warn(errorMsg,trimmedStackTrace);
					return;
				}

				// Handle fatal Grunt errors by killing Sails process as well
				if (consoleMsg.match(/Aborted due to warnings./)) {
					sails.log.warn('** Grunt :: Fatal Error **');
					sails.log.warn(trimmedStackTrace);
					console.log();

					sails.emit('hook:grunt:error', trimmedStackTrace);
					FatalError.__GruntAborted__(consoleMsg, trimmedStackTrace);
					return;
				}

				if (consoleMsg.match(/ParseError/)) {
					sails.log.warn('** Grunt :: Parse Warning **');
					sails.log.warn(trimmedStackTrace);
				}

				else sails.log.verbose('Grunt :: ' + consoleMsg);
			});

			child.stdout.on('error', function (consoleErr) {
				sails.log.error('Grunt :: ' + consoleErr);
			});
			child.stderr.on('data', function (consoleErr) {
				sails.log.error('Grunt :: ' + consoleErr);
			});
			child.stderr.on('error', function (consoleErr) {
				sails.log.error('Grunt :: ' + consoleErr);
			});

			// When process is complete, fire event on `sails`
			child.on('exit', function (code, s) {
				if ( code !== 0 ) return sails.emit('hook:grunt:error');
				sails.emit('hook:grunt:done');
			});

			// Since there's likely a watch task involved, and we may need
			// to flush the whole thing, we need a way to grab hold of the child process
			// So we save a reference to it
			sails.log.verbose('Tracking new grunt child process...');
			sails.childProcesses.push(child);

			// Go ahead and get out of here, since Grunt might sit there backgrounded
			cb_afterTaskStarted();
		}
	};
};

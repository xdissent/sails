var dependable = require('dependable'),
  _ = require('lodash'),
  path = require('path');

module.exports = function Sails (overrides) {
  // Create a dependency injection container.
  var container = this.container = dependable.container();

  // Register configuration overrides as a dependency.
  container.register('overrides', overrides || {});
  container.load(path.join(__dirname, 'core'));
  return this;

  // var core = ['defaults', 'config', '']
  // container.register('defaults', require('./defaults'));
  // container.register('config', require('./config'));
  // container.register('hooks', require('./hooks'));
  // container.register('')
  // container.register('server', function (hooks) {
    
  // });
};

Sails.prototype.lift = function(overrides) {
  var server = this.container.get('server');
  server.listen();
};
var dependable = require('dependable'),
  _ = require('lodash'),
  path = require('path');

function Sails (overrides) {
  var container = this.container = dependable.container();
  container.register('overrides', overrides || {});
  container.load(path.join(__dirname, 'core'));
  container.get('hooks');
}

Sails.prototype.lift = function () {
  var server = this.container.get('server');
  console.log(this.container.get('http').stack);
  server.listen(function () {
    console.log('Listening');
  });
};

Sails.prototype.lower = function () {
  var server = this.container.get('server');
  server.close();
};

Sails.cli = function () {
  require('./cli').apply(null, arguments);
};

module.exports = Sails;
var dependable = require('dependable'),
  _ = require('lodash'),
  path = require('path');

function Sails (overrides) {
  var container = this.container = dependable.container();
  container.register('overrides', overrides || {});
  container.load(path.join(__dirname, 'core'));
}

Sails.prototype.routes = function() {
  var server = this.container.get('server');
  console.log(this.container.get('http').routes);
};

Sails.prototype.middleware = function() {
  var server = this.container.get('server');
  console.log(this.container.get('middleware'));
};

Sails.prototype.lift = function() {
  var server = this.container.get('server');
  server.listen(function () {
    console.log('Listening');
  });
};

module.exports = Sails;
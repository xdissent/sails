var request = require('supertest'),
  should = require('should'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null;

describe('orm', function () {

  before(function (done) {
    sails = new Sails({
      appPath: path.resolve(__dirname, '../fixtures/orm'),
      hooks: ['orm'],
      server: {port: 0, host: 'localhost'},
      routes: {},
      orm: {connections: {'default': 'memory'}}
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  it('should globalize models', function (done) {
    should.exist(Foo);
    done();
  });
});
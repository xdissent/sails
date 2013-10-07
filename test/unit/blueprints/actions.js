var request = require('supertest'),
  path = require('path'),
  assert = require('assert'),
  Sails = require('../../../src'),
  sails = null;

describe('actions', function () {

  before(function (done) {
    sails = new Sails({
      appPath: path.resolve(__dirname, '../../fixtures/blueprints/rest'),
      blueprints: ['actions'],
      hooks: ['controllers', 'blueprints'],
      server: {port: 0, host: 'localhost'}
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  describe('routes', function () {

    it('should bind routes for all actions on a controller', function (done) {
      request(sails.server)
        .get('/foo/foo')
        .expect(200, 'FOO', function (err, res) {
          if (err) return done(err);
          request(sails.server)
            .get('/foo/bar')
            .expect(200, 'BAR', done);
        });
    });

    it('should bind routes for all array actions on a controller', function (done) {
      request(sails.server)
        .get('/foo/fooray')
        .expect(200, 'OK', done);
    });
  });
});
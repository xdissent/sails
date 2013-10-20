var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null;

describe('blueprints', function () {

  before(function (done) {
    sails = new Sails({
      appPath: path.resolve(__dirname, '../fixtures/blueprints/test'),
      blueprints: {
        enabled: ['test']
      },
      hooks: ['controllers', 'blueprints'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/optional': 'home.optional',
        '/extra': 'home.test'
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  describe('routes', function () {
    it('should install blueprint routes automatically', function (done) {
      request(sails.server)
        .get('/home/test')
        .expect(200, function (err, res) {
          if (err) return done(err);
          request(sails.server)
            .get('/home/index')
            .expect(200, function (err, res) {
            if (err) return done(err);
            request(sails.server)
              .get('/home/optional')
              .expect(404, done);
          });
        });
    });

    it('should allow mounting blueprint routes manually', function (done) {
      request(sails.server)
        .get('/optional')
        .expect(200, 'OPTIONAL', function (err, res) {
          if (err) return done(err);
          request(sails.server)
            .get('/extra')
            .expect(200, 'TEST', done);
        });
    });
  });

  describe('actions', function () {
    it('should be overridden by controller-defined actions', function (done) {
      request(sails.server)
        .get('/home/index')
        .expect(200, 'OK', done);
    });
  });
});
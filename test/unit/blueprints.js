var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null, server = null;

before(function (done) {
  sails = new Sails({
    appPath: path.resolve(__dirname, '../fixtures/blueprints'),
    blueprints: ['test'],
    hooks: ['adapters', 'models', 'controllers', 'blueprints'],
    routes: {
      '/optional': 'home.optional',
      '/extra': 'home.test'
    }
  });
  server = sails.container.get('server');
  server.listen(0, 'localhost', done);
});

after(function (done) {
  server.close(done);
});

// // Old sails:
// var request = require('supertest'),
//   path = require('path'),
//   Sails = require('../../lib/app'),
//   sails = null, server = null;

// before(function (done) {
//   sails = new Sails();
//   sails.lift({appPath: path.resolve(__dirname, '../fixtures/blueprints')}, function () {
//     server = sails.express.server;
//     done();
//   });
// });

// after(function (done) {
//   sails.lower(done);
// });

describe('blueprint routes', function () {
  it('should install blueprint routes automatically', function (done) {
    request(server)
      .get('/home/test')
      .expect(200, function (err, res) {
        if (err) return done(err);
        request(server)
          .get('/home/index')
          .expect(200, function (err, res) {
          if (err) return done(err);
          request(server)
            .get('/home/optional')
            .expect(404, done);
        });
      });
  });

  it('should allow mounting blueprint routes manually', function (done) {
    request(server)
      .get('/optional')
      .expect(200, 'OPTIONAL', function (err, res) {
        if (err) return done(err);
        request(server)
          .get('/extra')
          .expect(200, 'TEST', done);
      });
  });
});

describe('blueprint actions', function () {
  it('should be overridden by controller-defined actions', function (done) {
    request(server)
      .get('/home/index')
      .expect(200, 'OK', done);
  });
});
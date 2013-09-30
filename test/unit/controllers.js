var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null, server = null;

before(function (done) {
  sails = new Sails({
    appPath: path.resolve(__dirname, '../fixtures/controllers'),
    hooks: ['controllers']
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
//   sails.lift({appPath: path.resolve(__dirname, '../fixtures/controllers')}, function () {
//     server = sails.express.server;
//     done();
//   });
// });

// after(function (done) {
//   sails.lower(done);
// });

describe('controller routes', function () {
  it('should call index action for a string route without an explicit action', function (done) {
    request(server)
      .get('/controller/routes/string/implicit')
      .expect(200, 'OK', done);
  });

  it('should call index action for a string route with a verb without an explicit action', function (done) {
    request(server)
      .get('/controller/routes/string/implicit/verb')
      .expect(200, 'OK', done);
  });

  it('should call index action for a string route with an explicit action', function (done) {
    request(server)
      .get('/controller/routes/string/explicit')
      .expect(200, 'OK', done);
  });

  it('should call index action for an object route without an explicit action', function (done) {
    request(server)
      .get('/controller/routes/object/implicit')
      .expect(200, 'OK', done);
  });

  it('should call index action for an object route with a verb without an explicit action', function (done) {
    request(server)
      .get('/controller/routes/object/implicit/verb')
      .expect(200, 'OK', done);
  });

  it('should call index action for an object route with an explicit action', function (done) {
    request(server)
      .get('/controller/routes/object/explicit')
      .expect(200, 'OK', done);
  });

  it('should call index action for a long string route without an explicit action', function (done) {
    request(server)
      .get('/controller/routes/string/long/implicit')
      .expect(200, 'OK', done);
  });

  it('should call index action for a long string route with an explicit action', function (done) {
    request(server)
      .get('/controller/routes/string/long/explicit')
      .expect(200, 'OK', done);
  });

  it('should respond with a 404 if a controller is missing', function (done) {
    request(server)
      .get('/controller/routes/missing/controller')
      .expect(404, done);
  });

  it('should respond with a 404 if an action is missing', function (done) {
    request(server)
      .get('/controller/routes/missing/action')
      .expect(404, done);
  });

  it('should handle array routes with controllers', function (done) {
    request(server)
      .get('/controller/routes/array')
      .expect(200, 'OK', done);
  });
});

describe('controller actions', function () {
  it('should chain array actions', function (done) {
    request(server)
      .get('/controller/action/array')
      .expect(200, 'OK', done);
  });
});
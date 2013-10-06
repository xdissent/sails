var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null;

describe('controllers', function () {

  before(function (done) {
    sails = new Sails({
      appPath: path.resolve(__dirname, '../fixtures/controllers'),
      hooks: ['controllers'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/controller/routes/string/implicit': 'home',
        'get /controller/routes/string/implicit/verb': 'home',
        '/controller/routes/string/explicit': 'home.index',
        '/controller/routes/object/implicit': {controller: 'home'},
        'get /controller/routes/object/implicit/verb': {controller: 'home'},
        '/controller/routes/object/explicit': {controller: 'home', action: 'index'},
        '/controller/routes/string/long/implicit': 'HomeController',
        '/controller/routes/string/long/explicit': 'HomeController.index',
        '/controller/routes/missing/controller': 'missing.controller',
        '/controller/routes/missing/action': 'home.missing',
        '/controller/routes/array': [function (req, res, next) { next(); }, 'home.index'],
        '/controller/action/array': 'home.array',
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  describe('routes', function () {
    it('should call index action for a string route without an explicit action', function (done) {
      request(sails.server)
        .get('/controller/routes/string/implicit')
        .expect(200, 'OK', done);
    });

    it('should call index action for a string route with a verb without an explicit action', function (done) {
      request(sails.server)
        .get('/controller/routes/string/implicit/verb')
        .expect(200, 'OK', done);
    });

    it('should call index action for a string route with an explicit action', function (done) {
      request(sails.server)
        .get('/controller/routes/string/explicit')
        .expect(200, 'OK', done);
    });

    it('should call index action for an object route without an explicit action', function (done) {
      request(sails.server)
        .get('/controller/routes/object/implicit')
        .expect(200, 'OK', done);
    });

    it('should call index action for an object route with a verb without an explicit action', function (done) {
      request(sails.server)
        .get('/controller/routes/object/implicit/verb')
        .expect(200, 'OK', done);
    });

    it('should call index action for an object route with an explicit action', function (done) {
      request(sails.server)
        .get('/controller/routes/object/explicit')
        .expect(200, 'OK', done);
    });

    it('should call index action for a long string route without an explicit action', function (done) {
      request(sails.server)
        .get('/controller/routes/string/long/implicit')
        .expect(200, 'OK', done);
    });

    it('should call index action for a long string route with an explicit action', function (done) {
      request(sails.server)
        .get('/controller/routes/string/long/explicit')
        .expect(200, 'OK', done);
    });

    it('should respond with a 404 if a controller is missing', function (done) {
      request(sails.server)
        .get('/controller/routes/missing/controller')
        .expect(404, done);
    });

    it('should respond with a 404 if an action is missing', function (done) {
      request(sails.server)
        .get('/controller/routes/missing/action')
        .expect(404, done);
    });

    it('should handle array routes with controllers', function (done) {
      request(sails.server)
        .get('/controller/routes/array')
        .expect(200, 'OK', done);
    });
  });

  describe('actions', function () {
    it('should chain array actions', function (done) {
      request(sails.server)
        .get('/controller/action/array')
        .expect(200, 'OK', done);
    });
  });
});
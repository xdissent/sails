var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null;

describe('params', function() {

  beforeEach(function (done) {
    sails = new Sails({
      hooks: ['bodyParser', 'params'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/query': function (req, res, next) {
          res.send(200, req.params.all.test);
        },
        '/param/:test': function (req, res, next) {
          res.send(200, req.params.all.test);
        },
      }
    });
    sails.lift(done);
  });

  afterEach(function (done) {
    sails.lower(done);
  });

  describe('req.params.all helper', function () {

    it('should fold in route params', function (done) {
      request(sails.server)
        .get('/param/123')
        .expect(200, '123', done);
    });

    it('should fold in query params', function (done) {
      request(sails.server)
        .get('/query?test=123')
        .expect(200, '123', done);
    });

    it('should fold in body params', function (done) {
      request(sails.server)
        .post('/query')
        .type('json')
        .send({test: '123'})
        .expect(200, '123', done);
    });

    it('should override query params with body params', function (done) {
      request(sails.server)
        .post('/query?test=123')
        .type('json')
        .send({test: '456'})
        .expect(200, '456', done);
    });

    it('should override body params with route params', function (done) {
      request(sails.server)
        .post('/param/456')
        .type('json')
        .send({test: '123'})
        .expect(200, '456', done);
    });
  });
});
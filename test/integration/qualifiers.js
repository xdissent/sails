var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null;

describe('qualifiers', function() {

  beforeEach(function (done) {
    sails = new Sails({
      hooks: ['bodyParser', 'qualifiers'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/explicitlyAcceptsHTML': function (req, res, next) {
          res.send(200, req.explicitlyAcceptsHTML ? 'yes' : 'no');
        },
        '/wantsJson': function (req, res, next) {
          res.send(200, req.wantsJson ? 'yes' : 'no');
        },
        '/isAjax': function (req, res, next) {
          res.send(200, req.isAjax ? 'yes' : 'no');
        },
        '/isJson': function (req, res, next) {
          res.send(200, req.isJson ? 'yes' : 'no');
        },
        '/acceptJson': function (req, res, next) {
          res.send(200, req.acceptJson ? 'yes' : 'no');
        },
        '/isJsony': function (req, res, next) {
          res.send(200, req.isJsony ? 'yes' : 'no');
        }
      }
    });
    sails.lift(done);
  });

  afterEach(function (done) {
    sails.lower(done);
  });

  describe('req.explicitlyAcceptsHTML helper', function () {

    it('should be false if Accept header does not include HTML', function (done) {
      request(sails.server)
        .get('/explicitlyAcceptsHTML')
        .set('Accept', 'text/plain')
        .expect(200, 'no', done);
    });

    it('should be true if Accept header does include HTML', function (done) {
      request(sails.server)
        .get('/explicitlyAcceptsHTML')
        .set('Accept', 'text/html')
        .expect(200, 'yes', done);
    });
  });

  describe('req.wantsJson helper', function () {

    it('should be true for XHR requests', function (done) {
      request(sails.server)
        .get('/wantsJson')
        .set('X-Requested-With', 'xmlhttprequest')
        .expect(200, 'yes', done);
    });

    it('should be true if Accept header does not include HTML', function (done) {
      request(sails.server)
        .get('/wantsJson')
        .set('Accept', 'text/plain')
        .expect(200, 'yes', done);
    });

    it('should be false if Accept header does include HTML', function (done) {
      request(sails.server)
        .get('/wantsJson')
        .set('Accept', 'text/html')
        .expect(200, 'no', done);
    });

    it('should be true if req Content-Type is json with Accept header', function (done) {
      request(sails.server)
        .post('/wantsJson')
        .type('json')
        .send({test: 123})
        .set('Accept', 'text/json')
        .expect(200, 'yes', done);
    });

    it('should be false if req Content-Type is json with no Accept header', function (done) {
      request(sails.server)
        .post('/wantsJson')
        .type('json')
        .send({test: 123})
        .expect(200, 'no', done);
    });
  });

  describe('req.isAjax helper', function () {

    it('should be true for XHR requests', function (done) {
      request(sails.server)
        .get('/isAjax')
        .set('X-Requested-With', 'xmlhttprequest')
        .expect(200, 'yes', done);
    });

    it('should be false for non-XHR requests', function (done) {
      request(sails.server)
        .get('/isAjax')
        .expect(200, 'no', done);
    });
  });

  describe('req.isJson helper', function () {

    it('should be true for JSON requests', function (done) {
      request(sails.server)
        .post('/isJson')
        .type('json')
        .send({test: 123})
        .expect(200, 'yes', done);
    });

    it('should be false for non-JSON requests', function (done) {
      request(sails.server)
        .get('/isJson')
        .expect(200, 'no', done);
    });
  });

  describe('req.acceptJson helper', function () {

    it('should be false if Accept header does not include JSON', function (done) {
      request(sails.server)
        .get('/acceptJson')
        .set('Accept', 'text/plain')
        .expect(200, 'no', done);
    });

    it('should be true if Accept header does include JSON', function (done) {
      request(sails.server)
        .get('/acceptJson')
        .set('Accept', 'application/json')
        .expect(200, 'yes', done);
    });
  });

  describe('req.isJsony helper', function () {

    it('should be false if Accept header does not include JSON and body is not JSON', function (done) {
      request(sails.server)
        .get('/isJsony')
        .set('Accept', 'text/plain')
        .expect(200, 'no', done);
    });

    it('should be true if Accept header does include JSON', function (done) {
      request(sails.server)
        .get('/isJsony')
        .set('Accept', 'application/json')
        .expect(200, 'yes', done);
    });

    it('should be true if request body is JSON', function (done) {
      request(sails.server)
        .post('/isJson')
        .type('json')
        .send({test: 123})
        .expect(200, 'yes', done);
    });
  });
});
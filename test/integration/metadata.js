var request = require('supertest'),
  Sails = require('../../src'),
  sails = null;

describe('metadata', function() {

  before(function (done) {
    sails = new Sails({
      hooks: ['metadata'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/baseUrl': function (req, res, next) {
          var url = req.protocol + '://' + req.headers.host;
          if (req.baseUrl === req.baseUrl && req.baseUrl === url) {
            return res.send(200, 'OK');
          }
          next(new Error('FAIL'));
        },
        '/rawHost': function (req, res, next) {
          if (req.rawHost === '127.0.0.1') return res.send(200, 'OK');
          next(new Error('FAIL'));
        },
        '/rootUrl': function (req, res, next) {
          if (req.rootUrl === req.baseUrl) {
            return res.send(200, 'OK');
          }
          next(new Error('FAIL'));
        }
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  it('should set req.baseUrl', function (done) {
    request(sails.server)
      .get('/baseUrl')
      .expect(200, 'OK', done);
  });

  it('should set req.rawHost', function (done) {
    request(sails.server)
      .get('/rawHost')
      .expect(200, 'OK', done);
  });

  it('should set req.rootUrl', function (done) {
    request(sails.server)
      .get('/rootUrl')
      .expect(200, 'OK', done);
  });
});
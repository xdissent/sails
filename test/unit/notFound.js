var request = require('supertest'),
  Sails = require('../../src'),
  sails = null;

describe('notFound', function () {

  before(function (done) {
    sails = new Sails({
      hooks: ['notFound'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/present': function (req, res, next) {
          res.send(200, 'OK');
        }
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  it('should respond with a default 404 message', function (done) {
    request(sails.server)
      .get('/missing')
      .expect(404, 'Not Found', done);
  });

  it('should respond with a custom 404 message', function (done) {
    sails.overrides.notFound = {message: 'Missing'};
    sails.config.reload();
    request(sails.server)
      .get('/missing')
      .expect(404, 'Missing', done);
  });

  it('should respond with a custom 404 handler', function (done) {
    sails.overrides.notFound = {handler: function (req, res, next) {
      res.send(200, 'HANDLED');
    }};
    sails.config.reload();
    request(sails.server)
      .get('/missing')
      .expect(200, 'HANDLED', done);
  });

  it('should not respond if a request is handled', function (done) {
    request(sails.server)
      .get('/present')
      .expect(200, 'OK', done);
  });
});
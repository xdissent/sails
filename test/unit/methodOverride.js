var request = require('supertest'),
  Sails = require('../../src'),
  sails = null;

describe('methodOverride', function() {

  before(function (done) {
    sails = new Sails({
      hooks: ['bodyParser', 'methodOverride'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/method': function (req, res, next) {
          return res.send(200, req.method);
        }
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  it('should not alter req.method by default', function (done) {
    request(sails.server)
      .get('/method')
      .expect(200, 'GET', done);
  });

  it('should set req.method from req.body._method', function (done) {
    request(sails.server)
      .post('/method')
      .type('json')
      .send({_method: 'DELETE'})
      .expect(200, 'DELETE', done);
  });

  it('should set req.method from req.body._method case-insensitively', function (done) {
    request(sails.server)
      .post('/method')
      .type('json')
      .send({_method: 'delete'})
      .expect(200, 'DELETE', done);
  });

  it('should fallback to original method if invalid method given', function (done) {
    request(sails.server)
      .post('/method')
      .type('json')
      .send({_method: 'foo'})
      .expect(200, 'POST', done);
  });
});
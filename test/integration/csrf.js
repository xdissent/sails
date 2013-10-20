var request = require('supertest'),
  Sails = require('../../src'),
  sails = null;

describe('csrf', function () {

  before(function (done) {
    sails = new Sails({
      hooks: ['cookies', 'session', 'csrf'],
      server: {port: 0, host: 'localhost'},
      csrf: true,
      routes: {
        '/': function (req, res, next) {
          res.send(200, req.csrfToken() || 'none');
        }
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  it('should work with a valid token', function (done) {
    request(sails.server)
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        request(sails.server)
          .post('/')
          .set('Cookie', res.headers['set-cookie'])
          .set('X-CSRF-Token', res.text)
          .expect(200, done);
      });
  });

  it('should fail with an invalid token', function (done) {
    request(sails.server)
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        request(sails.server)
          .post('/')
          .set('Cookie', res.headers['set-cookie'])
          .set('X-CSRF-Token', '123')
          .expect(403, done);
      });
  });

  it('should fail without a token', function (done) {
    request(sails.server)
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        request(sails.server)
          .post('/')
          .set('Cookie', res.headers['set-cookie'])
          .expect(403, done);
      });
  });

  it('should fail without a session', function (done) {
    request(sails.server)
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        request(sails.server)
          .post('/')
          .set('X-CSRF-Token', res.text)
          .expect(403, done);
      });
  });
});
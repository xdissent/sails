var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null;

describe('flash', function() {

  beforeEach(function (done) {
    sails = new Sails({
      hooks: ['cookies', 'session', 'flash'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/': function (req, res, next) {
          var messages = req.flash('test');
          res.send(200, messages.length > 0 ? messages.join() : 'none');
        },
        '/flash': function (req, res, next) {
          req.flash('test', '123');
          res.redirect('/');
        }
      }
    });
    sails.lift(done);
  });

  afterEach(function (done) {
    sails.lower(done);
  });

  it('should save flash messages to session and removes them', function (done) {
    request(sails.server)
      .get('/flash')
      .expect(302, function (err, res) {
        if (err) return done(err);
        var cookie = res.headers['set-cookie'];
        request(sails.server)
          .get('/')
          .set('Cookie', cookie)
          .expect(200, '123', function (err, res) {
            request(sails.server)
              .get('/')
              .set('Cookie', cookie)
              .expect(200, 'none', done);
          });
      });
  });

});
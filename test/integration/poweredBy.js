var request = require('supertest'),
  Sails = require('../../src'),
  sails = null;

describe('poweredBy', function () {

  before(function (done) {
    sails = new Sails({
      hooks: ['poweredBy'],
      server: {port: 0, host: 'localhost'},
      poweredBy: 'Insanity Wolf',
      routes: {
        '/': function (req, res, next) {
          res.send(200, 'OK');
        }
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  it('should set the X-Powered-By header', function (done) {
    request(sails.server)
      .get('/')
      .expect('X-Powered-By', 'Insanity Wolf')
      .expect(200, 'OK', done);
  });

  it('should watch for poweredBy config changes', function (done) {
    request(sails.server)
      .get('/')
      .expect('X-Powered-By', 'Insanity Wolf')
      .expect(200, 'OK', function (err, res) {
        if (err) return done(err);
        sails.overrides.poweredBy = 'Blue Penguin';
        sails.config.reload();
        request(sails.server)
          .get('/')
          .expect('X-Powered-By', 'Blue Penguin')
          .expect(200, 'OK', done);
      });
  });
});
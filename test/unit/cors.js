var request = require('supertest'),
  assert = require('assert'),
  Sails = require('../../src'),
  sails = null

function corsNone (req, res, next) {
  res.send(200, 'OK');
}
function corsTrue (req, res, next) {
  res.send(200, 'OK');
}
function corsFalse (req, res, next) {
  res.send(200, 'OK');
}

corsTrue.cors = true;
corsFalse.cors = false;

describe('cors', function () {

  before(function (done) {
    sails = new Sails({
      hooks: ['cookies', 'session', 'csrf', 'cors'],
      server: {port: 0, host: 'localhost'},
      cors: {allRoutes: false},
      log: {level: 'verbose'},
      routes: {
        '/cors/none': corsNone,
        '/cors/true': corsTrue,
        '/cors/false': corsFalse
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  describe('routes', function () {
    it('should not set cors headers by default', function (done) {
      request(sails.server)
        .get('/cors/none')
        .expect(200, 'OK')
        .end(function (err, res) {
          if (err) return done(err);
          assert(typeof res.get('Access-Control-Allow-Origin') === 'undefined');
          assert(typeof res.get('Access-Control-Allow-Credentials') === 'undefined');
          assert(typeof res.get('Access-Control-Allow-Methods') === 'undefined');
          assert(typeof res.get('Access-Control-Allow-Headers') === 'undefined');
          done();
        });
    });

    it('should set cors headers if cors route option is true', function (done) {
      request(sails.server)
        .get('/cors/true')
        .expect('Access-Control-Allow-Origin', '*')
        .expect('Access-Control-Allow-Credentials', 'true')
        .expect(200, 'OK')
        .end(function (err, res) {
          if (err) return done(err);
          assert(typeof res.get('Access-Control-Allow-Methods') === 'undefined');
          assert(typeof res.get('Access-Control-Allow-Headers') === 'undefined');
          done();
        });
    });

    it('should unset cors headers if cors route option is false', function (done) {
      request(sails.server)
        .get('/cors/false')
        .expect(200, 'OK')
        .expect('Access-Control-Allow-Origin', '')
        .expect('Access-Control-Allow-Credentials', '')
        .expect('Access-Control-Allow-Methods', '')
        .expect('Access-Control-Allow-Headers', '')
        .expect(200, 'OK', done);
    });

    describe('with config.cors.allRoutes', function () {
      before(function (done) {
        sails.overrides.cors.allRoutes = true;
        sails.config.reload();
        setTimeout(done, 100);
      });

      it('should set cors headers by default', function (done) {
        request(sails.server)
          .get('/cors/none')
          .expect('Access-Control-Allow-Origin', '*')
          .expect('Access-Control-Allow-Credentials', 'true')
          .expect(200, 'OK')
          .end(function (err, res) {
            if (err) return done(err);
            assert(typeof res.get('Access-Control-Allow-Methods') === 'undefined');
            assert(typeof res.get('Access-Control-Allow-Headers') === 'undefined');
            done();
          });
      });

      it('should set cors headers if cors route option is true', function (done) {
        request(sails.server)
          .get('/cors/true')
          .expect('Access-Control-Allow-Origin', '*')
          .expect('Access-Control-Allow-Credentials', 'true')
          .expect(200, 'OK')
          .end(function (err, res) {
            if (err) return done(err);
            assert(typeof res.get('Access-Control-Allow-Methods') === 'undefined');
            assert(typeof res.get('Access-Control-Allow-Headers') === 'undefined');
            done();
          });
      });

      it('should unset cors headers if cors route option is false', function (done) {
        request(sails.server)
          .get('/cors/false')
          .expect(200, 'OK')
          .expect('Access-Control-Allow-Origin', '')
          .expect('Access-Control-Allow-Credentials', '')
          .expect('Access-Control-Allow-Methods', '')
          .expect('Access-Control-Allow-Headers', '')
          .expect(200, 'OK', done);
      });
    });
  });
});
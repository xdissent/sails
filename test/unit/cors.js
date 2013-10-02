var request = require('supertest'),
  path = require('path'),
  assert = require('assert'),
  Sails = require('../../src'),
  sails = null, server = null;

before(function (done) {
  sails = new Sails({
    hooks: ['cookies', 'session', 'csrf', 'cors', 'trace'],
    appPath: path.resolve(__dirname, '../fixtures/cors')
  });
  server = sails.server;
  server.listen(0, 'localhost', done);
});

after(function (done) {
  server.close(done);
});

// // Old sails:
// var request = require('supertest'),
//   path = require('path'),
//   Sails = require('../../lib/app'),
//   sails = null, server = null;

// before(function (done) {
//   sails = new Sails();
//   sails.lift({appPath: path.resolve(__dirname, '../fixtures/cors')}, function () {
//     server = sails.express.server;
//     done();
//   });
// });

// after(function (done) {
//   sails.lower(done);
// });

describe('cors routes', function () {
  it('should set cors headers', function (done) {
    request(server)
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
    request(server)
      .get('/cors/false')
      .expect(200, 'OK')
      .expect('Access-Control-Allow-Origin', '')
      .expect('Access-Control-Allow-Credentials', '')
      .expect('Access-Control-Allow-Methods', '')
      .expect('Access-Control-Allow-Headers', '')
      .expect(200, 'OK', done);
  });
});
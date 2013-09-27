var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null, server = null;

before(function (done) {
  sails = new Sails({appPath: path.resolve(__dirname, '../fixtures/session')});
  server = sails.server();
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
//   sails.lift({appPath: path.resolve(__dirname, '../fixtures/session')}, function () {
//     server = sails.express.server;
//     done();
//   });
// });

// after(function (done) {
//   sails.lower(done);
// });

describe('controller routes', function () {
  it('should set session variable tracked by cookie', function (done) {
    request(server)
      .get('/session/set')
      .expect(200, 'OK')
      .end(function (err, res) {
        if (err) return done(err);

        var cookies = res.headers['set-cookie'];
        if (!cookies) return done(new Error('Missing cookie'));

        request(server)
          .get('/session/get')
          .set('Cookie', cookies)
          .expect(200, 'OK', done);
      });
  });

  it('should not persist session variable without a cookie', function (done) {
    request(server)
      .get('/session/set')
      .expect(200, 'OK')
      .end(function (err, res) {
        if (err) return done(err);

        request(server)
          .get('/session/get')
          .expect(/FAIL/)
          .expect(500, done);
      });
  });

  it('should remove persisted cookies', function (done) {
    request(server)
      .get('/session/set')
      .expect(200, 'OK')
      .end(function (err, res) {
        if (err) return done(err);

        var cookies = res.headers['set-cookie'];
        if (!cookies) return done(new Error('Missing cookie'));

        request(server)
          .get('/session/get')
          .set('Cookie', cookies)
          .expect(200, 'OK', function (err, res) {
            if (err) return done(err);

            request(server)
              .get('/session/unset')
              .set('Cookie', cookies)
              .expect(200, 'OK', function (err, res) {
                if (err) return done(err);

                request(server)
                  .get('/session/get')
                  .set('Cookie', cookies)
                  .expect(/FAIL/)
                  .expect(500, done);
              });
          });
      });
  });
});
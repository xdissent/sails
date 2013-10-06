var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null;

describe('i18n', function() {

  beforeEach(function (done) {
    sails = new Sails({
      appPath: path.resolve(__dirname, '../fixtures/i18n'),
      hooks: ['cookies', 'i18n'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/res': function (req, res, next) {
          res.send(200, res.__('Hello'));
        },
        '/res/i18n': function (req, res, next) {
          res.send(200, res.i18n('Hello'));
        },
        '/locals': function (req, res, next) {
          res.send(200, res.locals.__('Hello'));
        },
        '/locals/i18n': function (req, res, next) {
          res.send(200, res.locals.i18n('Hello'));
        },
        '/cookie': function (req, res, next) {
          res.cookie('sails.locale', 'es');
          res.send(200, res.__('Hello'));
        }
      }
    });
    sails.lift(done);
  });

  afterEach(function (done) {
    sails.lower(done);
  });

  it('should translate to the default locale by default', function (done) {
    request(sails.server)
      .get('/res')
      .expect(200, 'Sup', function (err) {
        if (err) return done(err);

        sails.overrides.i18n = {defaultLocale: 'es'};
        sails.config.reload();

        request(sails.server)
          .get('/res')
          .expect(200, 'Hola', done);
      });
  });

  it('should choose the locale from a cookie', function (done) {
    request(sails.server)
      .get('/cookie')
      .expect(200, 'Sup')
      .end(function (err, res) {
        if (err) return done(err);
        request(sails.server)
          .get('/res')
          .set('Cookie', res.headers['set-cookie'])
          .expect(200, 'Hola', done)
      });
  });

  it('should choose the locale from the Accept-Language header', function (done) {
    request(sails.server)
      .get('/res')
      .set('Accept-Language', 'es')
      .expect(200, 'Hola', done);
  });

  it('should set legacy res.i18n helper', function (done) {
    request(sails.server)
      .get('/res/i18n')
      .expect(200, 'Sup', done);
  });

  it('should apply the i18n API to res.locals', function (done) {
    request(sails.server)
      .get('/locals')
      .expect(200, 'Sup', done);
  });

  it('should set legacy res.locals.i18n helper', function (done) {
    request(sails.server)
      .get('/locals/i18n')
      .expect(200, 'Sup', done);
  });
});
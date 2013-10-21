var request = require('supertest'),
  should = require('should'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null;

describe('services', function () {

  before(function (done) {
    sails = new Sails({
      appPath: path.resolve(__dirname, '../fixtures/services'),
      hooks: ['services'],
      server: {port: 0, host: 'localhost'},
      log: {level: 'verbose'},
      routes: {
        '/': function (req, res, next) {
          res.send(200, sails.hooks.services.test.test);
        },
        '/global': function (req, res, next) {
          if (typeof TestService !== 'undefined') {
            return res.send(200, TestService.test);
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

  it('should load services', function (done) {
    should.exist(sails.hooks.services.test);
    request(sails.server)
      .get('/')
      .expect(200, 'TEST', done);
  });

  it('should globalize services by default', function (done) {
    should.exist(TestService);
    request(sails.server)
      .get('/global')
      .expect(200, 'TEST', done);
  });

  it('should not globalize services by if services is false in globals config', function (done) {
    sails.overrides.globals = {services: false};
    sails.config.reload();
    request(sails.server)
      .get('/global')
      .expect(500, /FAIL/, done);
  });
});
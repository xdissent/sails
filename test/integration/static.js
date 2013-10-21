var request = require('supertest'),
  should = require('should'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null;

describe('static', function () {

  before(function (done) {
    sails = new Sails({
      hooks: ['static'],
      server: {port: 0, host: 'localhost'},
      paths: {
        'static': path.resolve(__dirname, '../fixtures/static/public')
      },
      'static': {},
      routes: {
        '/dynamic.txt': function (req, res, next) {
          res.send(200, 'ROUTE');
        }
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  it('should serve static files', function (done) {
    request(sails.server)
      .get('/static.txt')
      .expect(200, 'STATIC', done);
  });

  it('should be overridden by routes', function (done) {
    request(sails.server)
      .get('/dynamic.txt')
      .expect(200, 'ROUTE', done);
  });

  it('should serve index file for directories', function (done) {
    request(sails.server)
      .get('/')
      .expect(200, 'INDEX', done);
  });

  it('should not serve hidden files by default', function (done) {
    request(sails.server)
      .get('/.hidden.txt')
      .expect(404, done);
  });

  it('should serve hidden files if hidden is true in config', function (done) {
    sails.overrides['static'].hidden = true;
    sails.config.reload();
    request(sails.server)
      .get('/.hidden.txt')
      .expect(200, 'HIDDEN', done);
  });

  it('should watch for changes in static path config', function (done) {
    sails.overrides.paths['static'] = path.resolve(__dirname, '../fixtures/static');
    sails.config.reload();
    request(sails.server)
      .get('/public/static.txt')
      .expect(200, 'STATIC', done);
  });

  it('should redirect directory to directory with slash by default', function (done) {
    request(sails.server)
      .get('/public')
      .expect('Location', /public\//)
      .expect(303, done);
  });

  it('should not redirect directory to directory with slash if redirect is false in config', function (done) {
    sails.overrides['static'].redirect = false;
    sails.config.reload();
    request(sails.server)
      .get('/public')
      .expect(404, done);
  });

  it('should serve index files by name given in config', function (done) {
    sails.overrides['static'].index = 'static.txt';
    sails.config.reload();
    request(sails.server)
      .get('/public/')
      .expect(200, 'STATIC', done);
  });
});
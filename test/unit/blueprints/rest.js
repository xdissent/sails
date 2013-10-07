var request = require('supertest'),
  path = require('path'),
  assert = require('assert'),
  Sails = require('../../../src'),
  sails = null;

describe('rest', function () {

  before(function (done) {
    sails = new Sails({
      appPath: path.resolve(__dirname, '../../fixtures/blueprints/rest'),
      blueprints: ['rest'],
      hooks: ['bodyParser', 'adapters', 'models', 'params', 'controllers', 'blueprints'],
      server: {port: 0, host: 'localhost'},
      routes: {},
      // log: {level: 'verbose'},
      adapters: {'default': 'memory'}
    });
    sails.lift(function (err) {
      if (err) return done(err);
      sails.hooks.models.foo.createEach([
        {name: 'one', description: 'uno', color: 'red'},
        {name: 'two', description: 'dos', color: 'blue'},
        {name: 'three', description: 'tres', color: 'red'}
      ], done);
    });
  });

  after(function (done) {
    sails.lower(done);
  });

  describe('find', function () {

    it('should return all models if no id in params', function (done) {
      request(sails.server)
        .get('/foo')
        .expect('Content-Type', /json/)
        .expect(200, function (err, res) {
          if (err) return done(err);
          assert.equal(res.body.length, 3);
          assert.equal(res.body[0].name, 'one');
          assert.equal(res.body[2].description, 'tres');
          done();
        });
    });

    it('should one model if id in params', function (done) {
      request(sails.server)
        .get('/foo/2')
        .expect('Content-Type', /json/)
        .expect(200, function (err, res) {
          if (err) return done(err);
          assert.equal(res.body.name, 'two');
          done();
        });
    });

    it('should return 404 if a model with the given id does not exist', function (done) {
      request(sails.server)
        .get('/foo/5')
        .expect(404, done);
    });

    it('should return all models matching where params', function (done) {
      request(sails.server)
        .get('/foo?color=red')
        .expect('Content-Type', /json/)
        .expect(200, function (err, res) {
          if (err) return done(err);
          assert.equal(res.body.length, 2);
          done();
        });
    });
  });

  describe('create', function () {

    it('should create a model via JSON POST', function (done) {
      request(sails.server)
        .post('/foo')
        .type('json')
        .send({name: 'four', description: 'quatro', color: 'yellow'})
        .expect('Content-Type', /json/)
        .expect(201, function (err, res) {
          if (err) return done(err);
          assert.equal(res.body.name, 'four');
          assert.equal(res.body.description, 'quatro');
          assert.equal(res.body.color, 'yellow');
          done();
        });
    });
  });

  describe('update', function () {

    it('should update a model via JSON POST', function (done) {
      request(sails.server)
        .put('/foo/4')
        .type('json')
        .send({name: 'xxx'})
        .expect('Content-Type', /json/)
        .expect(200, function (err, res) {
          if (err) return done(err);
          assert.equal(res.body.name, 'xxx');
          assert.equal(res.body.description, 'quatro');
          assert.equal(res.body.color, 'yellow');

          request(sails.server)
            .get('/foo/4')
            .expect(200, function (err, res) {
              if (err) return done(err);
              assert.equal(res.body.name, 'xxx');
              assert.equal(res.body.description, 'quatro');
              assert.equal(res.body.color, 'yellow');
              done();
            });
        });
    });

    it('should return 404 if a model with the given id does not exist', function (done) {
      request(sails.server)
        .put('/foo/5')
        .type('json')
        .send({name: 'xxx'})
        .expect(404, done);
    });
  });

  describe('destroy', function () {

    it('should destroy a model via JSON POST', function (done) {
      request(sails.server)
        .del('/foo/4')
        .expect(200, function (err, res) {
          if (err) return done(err);
          request(sails.server)
            .get('/foo/4')
            .expect(404, done);
        });
    });

    it('should return 404 if a model with the given id does not exist', function (done) {
      request(sails.server)
        .del('/foo/5')
        .expect(404, done);
    });
  });
});
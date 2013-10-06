var request = require('supertest'),
  Sails = require('../../src'),
  sails = null;

describe('bodyParser', function() {

  before(function (done) {
    sails = new Sails({
      hooks: ['bodyParser'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/': function (req, res, next) {
          if (typeof req.body === 'object' && parseInt(req.body.test) === 123) {
            return res.send(200, 'OK');
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

  it('should parse json bodies', function (done) {
    request(sails.server)
      .post('/')
      .type('json')
      .send({test: 123})
      .expect(/OK/)
      .expect(200, done);
  });

  it('should parse form bodies', function (done) {
    request(sails.server)
      .post('/')
      .type('form')
      .send('test=123')
      .expect(/OK/)
      .expect(200, done);
  });

  it('should parse multipart bodies', function (done) {
    request(sails.server)
      .post('/')
      .field('test', '123')
      .expect(/OK/)
      .expect(200, done);
  });
});
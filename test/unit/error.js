var request = require('supertest'),
  _ = require('lodash'),
  Sails = require('../../src'),
  sails = null;

describe('error', function () {

  before(function (done) {
    sails = new Sails({
      hooks: ['error'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/success': function (req, res, next) {
          res.send(200, 'OK');
        },
        '/fail': function (req, res, next) {
          next(new Error('FAIL'));
        },
        '/helper/:helper/exists': function (req, res, next) {
          if (typeof res[req.params.helper] === 'function') {
            return res.send(200, 'OK');
          }
          next(new Error('FAIL'));
        },
        '/helper/:helper/shortcut': [function (req, res, next) {
          res[req.params.helper]();
        }, function (req, res, next) {
          next(new Error('FAIL'));
        }],
        '/helper/:helper/error': function (req, res, next) {
          res[req.params.helper](new Error('ERROR'));
        },
        '/helper/:helper/message': function (req, res, next) {
          res[req.params.helper]('BUMMER');
        },
        '/helper/:helper/status': function (req, res, next) {
          res[req.params.helper](503);
        },
        '/helper/:helper/statusAndMessage': function (req, res, next) {
          res[req.params.helper](505, 'WEIRD');
        },
        '/helper/:helper/errorAndStatus': function (req, res, next) {
          var err = new Error('ERROR');
          err.status = 504;
          res[req.params.helper](505, err);
        },
        '/helper/:helper/errorAndMessage': function (req, res, next) {
          var err = new Error('ERROR');
          err.status = 504;
          res[req.params.helper]('OVERRIDE', err);
        },
        '/helper/:helper/errorAndStatusAndMessage': function (req, res, next) {
          var err = new Error('ERROR');
          err.status = 504;
          res[req.params.helper](505, 'OVERRIDE', err);
        },
        '/helper/:helper/json': function (req, res, next) {
          req.wantsJson = true;
          res[req.params.helper]('JSON');
        },
        '/helper/:helper/view': function (req, res, next) {
          res.view = function (view, data, cb) {
            cb(null, 'VIEW');
          };
          res[req.params.helper]();
        },
        '/helper/:helper/render': function (req, res, next) {
          res.render = function (view, data, cb) {
            cb(null, 'RENDER');
          };
          res[req.params.helper]();
        },
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  describe('middleware', function () {

    it('should respond with a 500 error', function (done) {
      request(sails.server)
        .get('/fail')
        .expect(500, 'FAIL', done);
    });
  });

  describe('response helpers', function () {

    var helpers = {
      error: [500],
      serverError: [500, 'Internal Server Error'],
      forbidden: [403, 'Forbidden'],
      badRequest: [400, 'Bad Request']
    };
    
    _.each(helpers, function (values, helper) {
      var status = values[0],
        message = values[1];

      describe(helper, function () {

        it('should add the response helper', function (done) {
          request(sails.server)
            .get('/helper/' + helper + '/exists')
            .expect(200, 'OK', done);
        });

        it('should shortcut routes', function (done) {
          request(sails.server)
            .get('/helper/' + helper + '/shortcut')
            .expect(status, done);
        });

        it('should accept an error object', function (done) {
          request(sails.server)
            .get('/helper/' + helper + '/error')
            .expect(status, message || 'ERROR', done);
        });

        it('should accept an error message', function (done) {
          request(sails.server)
            .get('/helper/' + helper + '/message')
            .expect(status, 'BUMMER', done);
        });

        it('should accept an error status', function (done) {
          request(sails.server)
            .get('/helper/' + helper + '/status')
            .expect(503, done);
        });

        it('should accept an error status and message', function (done) {
          request(sails.server)
            .get('/helper/' + helper + '/statusAndMessage')
            .expect(505, 'WEIRD', done);
        });

        it('should accept an error and status, overriding error properties', function (done) {
          request(sails.server)
            .get('/helper/' + helper + '/errorAndStatus')
            .expect(505, message || 'ERROR', done);
        });

        it('should accept an error and message, overriding error properties (except status if default helper)', function (done) {
          var expected = (helper === 'error') ? 504 : status;
          request(sails.server)
            .get('/helper/' + helper + '/errorAndMessage')
            .expect(expected, 'OVERRIDE', done);
        });

        it('should accept an error, status and message, overriding error properties', function (done) {
          request(sails.server)
            .get('/helper/' + helper + '/errorAndStatusAndMessage')
            .expect(505, 'OVERRIDE', done);
        });

        it('should respond with JSON if the req wants JSON', function (done) {
          var expected = {
            error: {
              status: status,
              message: 'JSON'
            },
            status: status,
            message: 'JSON'
          };
          request(sails.server)
            .get('/helper/' + helper + '/json')
            .expect('Content-Type', /json/)
            .expect(status, expected, done);
        });

        it('should respond with a rendered view if res.views exists', function (done) {
          request(sails.server)
            .get('/helper/' + helper + '/view')
            .expect(status, 'VIEW', done);
        });

        it('should respond with a rendered view if res.render exists', function (done) {
          request(sails.server)
            .get('/helper/' + helper + '/render')
            .expect(status, 'RENDER', done);
        });
      });
    });
  });
});
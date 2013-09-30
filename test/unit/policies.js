var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null,
  lift = function (policies, done) {
    sails = new Sails({appPath: path.resolve(__dirname, '../fixtures/policies'), policies: policies});
    sails.container.get('server').listen(0, 'localhost', function () {
      done(sails.container.get('server'));
    });
  };

afterEach(function (done) {
  sails.container.get('server').close(done);
});

// // Old sails:
// var request = require('supertest'),
//   path = require('path'),
//   Sails = require('../../lib/app'),
//   sails = null, server = null;

// before(function (done) {
//   sails = new Sails();
//   sails.lift({appPath: path.resolve(__dirname, '../fixtures/policies')}, function () {
//     server = sails.express.server;
//     done();
//   });
// });

// after(function (done) {
//   sails.lower(done);
// });


describe('policy definitions', function () {

  it('should accept a policy as a name', function (done) {
    var policies = {'*': 'test'};
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(200, 'TEST', done);
    });
  });

  it('should accept a policy as a function', function (done) {
    var policies = {
      '*': function (req, res, next) {
        res.send(200, 'FUNCTION');
      }
    };
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(200, 'FUNCTION', done);
    });
  });

  it('should accept a policy as an array of functions', function (done) {
    var policies = {
      '*': [function (req, res, next) {
        res.array = true;
        next();
      }, function (req, res, next) {
        if (res.array) return res.send(200, 'ARRAY');
        next(new Error('FAIL'));
      }]
    };
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(200, 'ARRAY', done);
    });
  });

  it('should accept a policy as an array of names', function (done) {
    var policies = {
      '*': ['custom', 'test']
    };
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(200, 'CUSTOMTEST', done);
    });
  });

  it('should accept a policy as a mixed array', function (done) {
    var policies = {
      '*': ['custom', function (req, res, next) {
        if (res.custom) return res.send(200, 'CUSTOM');
        next(new Error('FAIL'));
      }]
    };
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(200, 'CUSTOM', done);
    });
  });
});


describe('view policies', function () {

  it('should deny view if star is false', function (done) {
    var policies = {'*': false};
    lift(policies, function (server) {
      request(server)
        .get('/view')
        .expect(403, done);
    });
  });

  it('should allow view if star is true', function (done) {
    var policies = {'*': true};
    lift(policies, function (server) {
      request(server)
        .get('/view')
        .expect(200, 'HOME', done);
    });
  });

  it('should deny an view if top level target is false', function (done) {
    var policies = {'*': true, home: false};
    lift(policies, function (server) {
      request(server)
        .get('/view')
        .expect(403, done);
    });
  });

  it('should allow an entire controller if top level target is true', function (done) {
    var policies = {'*': false, home: true};
    lift(policies, function (server) {
      request(server)
        .get('/view')
        .expect(200, 'HOME', done);
    });
  });

  it('should deny a controller action if subtarget is false', function (done) {
    var policies = {'*': true, home: {'*': true, index: false}};
    lift(policies, function (server) {
      request(server)
        .get('/view')
        .expect(403, done);
    });
  });

  it('should allow a controller action if subtarget is true', function (done) {
    var policies = {'*': false, home: {'*': false, index: true}};
    lift(policies, function (server) {
      request(server)
        .get('/view')
        .expect(200, 'HOME', done);
    });
  });
});


describe('controller policies', function () {
  
  it('should deny controller action if star is false', function (done) {
    var policies = {'*': false};
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(403, done);
    });
  });

  it('should allow controller action if star is true', function (done) {
    var policies = {'*': true};
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(200, 'OK', done);
    });
  });

  it('should deny an entire controller if top level target is false', function (done) {
    var policies = {'*': true, home: false};
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(403, done);
    });
  });

  it('should allow an entire controller if top level target is true', function (done) {
    var policies = {'*': false, home: true};
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(200, 'OK', done);
    });
  });

  it('should deny a controller action if subtarget is false', function (done) {
    var policies = {'*': true, home: {'*': true, index: false}};
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(403, done);
    });
  });

  it('should allow a controller action if subtarget is true', function (done) {
    var policies = {'*': false, home: {'*': false, index: true}};
    lift(policies, function (server) {
      request(server)
        .get('/')
        .expect(200, 'OK', done);
    });
  });
});
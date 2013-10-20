var request = require('supertest'),
  Sails = require('../../src'),
  sails = null;

describe('middleware', function () {

  before(function (done) {
    sails = new Sails({
      server: {port: 0, host: 'localhost'},
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });
});
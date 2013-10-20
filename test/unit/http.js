var should = require('should'),
  sinon = require('sinon'),
  Sails = require('../../src'),
  sails = new Sails(),
  http = null,
  mocks = null;

describe('http', function () {

  beforeEach(function () {
    mocks = {
      config: {
        http: {test: 123},
        watch: sinon.spy()
      },
      environment: 'test'
    };

    http = sails.container.get('http', mocks);
  });

  it('should should be a function', function () {
    http.should.be.a.Function;
  });

  it('should set the environment', function () {
    http.get('env').should.equal(mocks.environment);
  });

  it('should set values from the http config', function () {
    http.get('test').should.equal(mocks.config.http.test);
  });

  it('should watch the http config key', function () {
    mocks.config.watch.calledOnce.should.equal.true;
    mocks.config.watch.args[0].should.have.lengthOf(2);
    mocks.config.watch.args[0][0].should.equal('http');
    mocks.config.watch.args[0][1].should.be.a.Function;
  });

  it('should update values from the http config when changed', function () {
    mocks.config.http = {'test': 321};
    mocks.config.watch.args[0][1]();
    http.get('test').should.equal(321);
  });

  it('should add values from the http config when changed', function () {
    mocks.config.http = {'other': 123};
    mocks.config.watch.args[0][1]();
    http.get('other').should.equal(123);
  });

  it('should remove values from the http config when changed', function () {
    mocks.config.http = {};
    mocks.config.watch.args[0][1]();
    should.not.exist(http.get('test'));
  });

  it('should not alter config values set from express API', function () {
    http.set('other', 123);
    mocks.config.http = {};
    mocks.config.watch.args[0][1]();
    http.get('other').should.equal(123);
  });
});
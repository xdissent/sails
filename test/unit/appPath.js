var should = require('should'),
  Sails = require('../../src'),
  sails = new Sails();

function appPath (overrides) {
  return sails.container.get('appPath', {overrides: overrides || {}});
}

describe('appPath', function () {

  it('should should be a string', function () {
    appPath().should.be.a.String;
  });

  it('should use process.cwd() by default', function () {
    appPath().should.equal(process.cwd());
  });

  it('should use appPath from overrides if present', function () {
    appPath({appPath: '/dev/null'}).should.equal('/dev/null');
  });

  it('should use app paths config from overrides if present', function () {
    appPath({paths: {app: '/dev/null'}}).should.equal('/dev/null');
  });
});
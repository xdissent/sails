var should = require('should'),
  Sails = require('../../src'),
  sails = new Sails();

function defaults (overrides) {
  return sails.container.get('defaults', {overrides: overrides || {}});
}

describe('defaults', function () {

  it('should should be a object', function () {
    defaults().should.be.a.Object;
  });

  it('should prepend appPath to paths', function () {
    var appPath = sails.container.get('appPath', {});
    var defs = defaults();
    defs.paths.app.should.equal(appPath);
    defs.paths.config.should.equal(appPath + '/config');
  });
});
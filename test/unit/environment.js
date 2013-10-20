var should = require('should'),
  Sails = require('../../src'),
  sails = new Sails();

function environment (overrides) {
  return sails.container.get('environment', {overrides: overrides || {}});
}

describe('environment', function () {

  it('should should be a string', function () {
    environment().should.be.a.String;
  });

  it('should use NODE_ENV env variable by default', function () {
    var orig = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'testing';
    environment().should.equal('testing');
    process.env['NODE_ENV'] = orig;
  });

  it('should throw if dev and prod are both set in overrides', function () {
    (function () {
      environment({dev: true, prod: true});
    }).should.throw();
  });

  it('should use production if prod is set in overrides', function () {
    environment({prod: true}).should.equal('production');
  });

  it('should use development if dev is set in overrides', function () {
    environment({dev: true}).should.equal('development');
  });

  it('should use specified env if env is set in overrides', function () {
    environment({env: 'testing'}).should.equal('testing');
  });

  it('should use specified environment if environment is set in overrides', function () {
    environment({environment: 'testing'}).should.equal('testing');
  });
});
var should = require('should'),
  Sails = require('../../src'),
  sails = new Sails(),
  globals = null;

describe('globals', function () {

  beforeEach(function () {
    globals = sails.container.get('globals', {});
  });

  afterEach(function () {
    globals.unglobalizeAll();
  });

  describe('globalize', function () {
  
    it('should be exposed as a method', function () {
      globals.should.have.property('globalize');
      globals.globalize.should.be.a.Function;
    });

    it('should throw if no name provided', function () {
      (function () {
        globals.globalize();
      }).should.throw();
    });

    it('should throw if empty name provided', function () {
      (function () {
        globals.globalize('');
      }).should.throw();
    });

    it('should throw if no value provided', function () {
      (function () {
        globals.globalize('something');
      }).should.throw();
    });

    it('should add the global with the specified name and value', function () {
      globals.globalize('something', 123);
      should.exist(something);
      something.should.equal(123);
    });

    it('should throw if already globalized name', function () {
      globals.globalize('something', 123);
      (function () {
        globals.globalize('something', 124);
      }).should.throw();
    });
  });

  describe('unglobalize', function () {
  
    it('should be exposed as a method', function () {
      globals.should.have.property('unglobalize');
      globals.unglobalize.should.be.a.Function;
    });

    it('should throw if no name provided', function () {
      (function () {
        globals.unglobalize();
      }).should.throw();
    });

    it('should throw if empty name provided', function () {
      (function () {
        globals.unglobalize('');
      }).should.throw();
    });

    it('should throw if not globalized', function () {
      (function () {
        globals.unglobalize('something');
      }).should.throw();
    });

    it('should remove the global with the specified name', function () {
      globals.globalize('something', 123);
      should.exist(something);
      something.should.equal(123);
      globals.unglobalize('something');
      should.not.exist(global.something);
    });

    it('should an object value to unglobalize', function () {
      var obj = {};
      globals.globalize('something1', obj);
      globals.globalize('something2', obj);
      should.exist(something1);
      should.exist(something2);
      globals.unglobalize(obj);
      should.not.exist(global.something1);
      should.not.exist(global.something2);
    });

    it('should accept an array of names to unglobalize', function () {
      globals.globalize('something1', 123);
      globals.globalize('something2', 124);
      should.exist(something1);
      should.exist(something2);
      globals.unglobalize(['something1', 'something2']);
      should.not.exist(global.something1);
      should.not.exist(global.something2);
    });

    it('should accept an array of object values to unglobalize', function () {
      var obj1 = {}, obj2 = {};
      globals.globalize('something1', obj1);
      globals.globalize('something2', obj2);
      should.exist(something1);
      should.exist(something2);
      globals.unglobalize([obj1, obj2]);
      should.not.exist(global.something1);
      should.not.exist(global.something2);
    });

    it('should accept an array of mixed names and object values to unglobalize', function () {
      var obj1 = {}, obj2 = {};
      globals.globalize('something1', obj1);
      globals.globalize('something2', obj2);
      should.exist(something1);
      should.exist(something2);
      globals.unglobalize(['something1', obj2]);
      should.not.exist(global.something1);
      should.not.exist(global.something2);
    });

    it('should throw if any member of array is not globalized', function () {
      var obj1 = {}, obj2 = {};
      globals.globalize('something1', obj1);
      globals.globalize('something2', obj2);
      should.exist(something1);
      should.exist(something2);
      (function () {
        globals.unglobalize(['something1', obj2, 'missing']);
      }).should.throw();
    });
  });

  describe('unglobalizeAll', function () {
  
    it('should be exposed as a method', function () {
      globals.should.have.property('unglobalizeAll');
      globals.unglobalizeAll.should.be.a.Function;
    });

    it('should unglobalize all previously globalized values', function () {
      globals.globalize('something1', 123);
      globals.globalize('something2', 124);
      should.exist(something1);
      should.exist(something2);
      globals.unglobalizeAll();
      should.not.exist(global.something1);
      should.not.exist(global.something2);
    });
  });
});
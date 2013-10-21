var should = require('should'),
  sinon = require('sinon'),
  Sails = require('../../src'),
  sails = new Sails(),
  middleware = null,
  mocks = null;

describe('middleware', function () {

  beforeEach(function () {

    mocks = {
      config: {},
      http: {
        stack: [
          {path: '/one', handle: function one () {}},
          {path: '/two', handle: function two () {}},
          {path: '/three', handle: function three () {}},
          {path: '/four', handle: function four () {}},
          {path: '/five', handle: function five () {}}
        ],
        use: function (route, mw) {
          if (typeof route === 'function') mw = route, route = '/';
          mocks.http.stack.push({handle: mw, path: route});
        }
      }
    };
    
    middleware = sails.container.get('middleware', mocks);
  });

  describe('use', function () {

    it('should be exposed as a method', function () {
      middleware.should.have.property('use');
      middleware.use.should.be.a.Function;
    });

    it('should throw on adding invalid middleware', function () {
      (function () {
        middleware.use();
      }).should.throw();
      (function () {
        middleware.use(null);
      }).should.throw();
      (function () {
        middleware.use('xxx');
      }).should.throw();
      (function () {
        middleware.use(123);
      }).should.throw();
      (function () {
        middleware.use({});
      }).should.throw();
      (function () {
        middleware.use(new Error());
      }).should.throw();
    });

    it('should append middleware if no index is given', function () {
      var mw = function () {};
      middleware.use(mw);
      mocks.http.stack.should.have.lengthOf(6);
      mocks.http.stack[5].handle.should.equal(mw);
    });

    it('should insert middleware at the given index', function () {
      var mw = function () {};
      middleware.use(mw, 3);
      mocks.http.stack.should.have.lengthOf(6);
      mocks.http.stack[3].handle.should.equal(mw);
    });

    it('should throw on index greater than length', function () {
      var mw = function () {};
      (function () {
        middleware.use(mw, 6);
      }).should.throw();
    });

    it('should accept a negative index', function () {
      var mw = function () {};
      middleware.use(mw, -3);
      mocks.http.stack.should.have.lengthOf(6);
      mocks.http.stack[2].handle.should.equal(mw);
    });

    it('should throw on index less than negative length', function () {
      var mw = function () {};
      (function () {
        middleware.use(mw, -6);
      }).should.throw();
    });

    describe('with replace argument', function () {
    
      it('should append middleware if no index is given and replace is zero', function () {
        var mw = function () {};
        middleware.use(mw, undefined, 0);
        mocks.http.stack.should.have.lengthOf(6);
        mocks.http.stack[5].handle.should.equal(mw);
      });

      it('should insert middleware at the given index if replace is zero', function () {
        var mw = function () {};
        middleware.use(mw, 3, 0);
        mocks.http.stack.should.have.lengthOf(6);
        mocks.http.stack[3].handle.should.equal(mw);
      });

      it('should replace middleware at index if replace is one', function () {
        var mw = function () {};
        middleware.use(mw, 3, 1);
        mocks.http.stack.should.have.lengthOf(5);
        mocks.http.stack[3].handle.should.equal(mw);
      });

      it('should insert middleware at index and remove number given in replace', function () {
        var mw = function () {};
        middleware.use(mw, 3, 2);
        mocks.http.stack.should.have.lengthOf(4);
        mocks.http.stack[3].handle.should.equal(mw);
      });

      it('should accept a negative index', function () {
        var mw = function () {};
        middleware.use(mw, -3, 3);
        mocks.http.stack.should.have.lengthOf(3);
        mocks.http.stack[2].handle.should.equal(mw);
      });

      it('should throw on replace greater than length minus index given positive index', function () {
        var mw = function () {};
        (function () {
          middleware.use(mw, 3, 3);
        }).should.throw();
      });

      it('should throw on replace greater than zero minus index given negative index', function () {
        var mw = function () {};
        (function () {
          middleware.use(mw, -3, 4);
        }).should.throw();
      });
    });
  });

  describe('append', function () {

    it('should be exposed as a method', function () {
      middleware.should.have.property('append');
      middleware.append.should.be.a.Function;
    });

    it('should append middleware', function () {
      var mw = function () {};
      middleware.append(mw);
      mocks.http.stack.should.have.lengthOf(6);
      mocks.http.stack[5].handle.should.equal(mw);
    });
  });

  describe('prepend', function () {

    it('should be exposed as a method', function () {
      middleware.should.have.property('prepend');
      middleware.prepend.should.be.a.Function;
    });

    it('should prepend middleware', function () {
      var mw = function () {};
      middleware.prepend(mw);
      mocks.http.stack.should.have.lengthOf(6);
      mocks.http.stack[0].handle.should.equal(mw);
    });
  });

  describe('insertBefore', function () {

    it('should be exposed as a method', function () {
      middleware.should.have.property('insertBefore');
      middleware.insertBefore.should.be.a.Function;
    });

    it('should insert middleware before given middleware function', function () {
      var mw = function () {};
      middleware.insertBefore(mocks.http.stack[2].handle, mw);
      mocks.http.stack.should.have.lengthOf(6);
      mocks.http.stack[2].handle.should.equal(mw);
    });

    it('should insert middleware before given middleware name', function () {
      var mw = function () {};
      middleware.insertBefore('three', mw);
      mocks.http.stack.should.have.lengthOf(6);
      mocks.http.stack[2].handle.should.equal(mw);
    });

    it('should throw on missing before middleware', function () {
      var mw = function () {};
      (function () {
        middleware.insertBefore();
      }).should.throw();
      (function () {
        middleware.insertBefore(mw);
      }).should.throw();
      (function () {
        middleware.insertBefore(undefined, mw);
      }).should.throw();
      (function () {
        middleware.insertBefore(null, mw);
      }).should.throw();
      (function () {
        middleware.insertBefore('xxx', mw);
      }).should.throw();
      (function () {
        middleware.insertBefore(123, mw);
      }).should.throw();
      (function () {
        middleware.insertBefore({}, mw);
      }).should.throw();
    });
  });

  describe('insertAfter', function () {

    it('should be exposed as a method', function () {
      middleware.should.have.property('insertAfter');
      middleware.insertAfter.should.be.a.Function;
    });

    it('should insert middleware before given middleware function', function () {
      var mw = function () {};
      middleware.insertAfter(mocks.http.stack[2].handle, mw);
      mocks.http.stack.should.have.lengthOf(6);
      mocks.http.stack[3].handle.should.equal(mw);
    });

    it('should insert middleware before given middleware name', function () {
      var mw = function () {};
      middleware.insertAfter('three', mw);
      mocks.http.stack.should.have.lengthOf(6);
      mocks.http.stack[3].handle.should.equal(mw);
    });

    it('should throw on missing before middleware', function () {
      var mw = function () {};
      (function () {
        middleware.insertAfter();
      }).should.throw();
      (function () {
        middleware.insertAfter(mw);
      }).should.throw();
      (function () {
        middleware.insertAfter(undefined, mw);
      }).should.throw();
      (function () {
        middleware.insertAfter(null, mw);
      }).should.throw();
      (function () {
        middleware.insertAfter('xxx', mw);
      }).should.throw();
      (function () {
        middleware.insertAfter(123, mw);
      }).should.throw();
      (function () {
        middleware.insertAfter({}, mw);
      }).should.throw();
    });
  });

  describe('replace', function () {

    it('should be exposed as a method', function () {
      middleware.should.have.property('replace');
      middleware.replace.should.be.a.Function;
    });

    it('should replace given middleware by function', function () {
      var mw = function () {};
      middleware.replace(mocks.http.stack[2].handle, mw);
      mocks.http.stack.should.have.lengthOf(5);
      mocks.http.stack[2].handle.should.equal(mw);
    });

    it('should replace given middleware by name', function () {
      var mw = function () {};
      middleware.replace('three', mw);
      mocks.http.stack.should.have.lengthOf(5);
      mocks.http.stack[2].handle.should.equal(mw);
    });

    it('should throw on missing replace middleware', function () {
      var mw = function () {};
      (function () {
        middleware.replace();
      }).should.throw();
      (function () {
        middleware.replace(mw);
      }).should.throw();
      (function () {
        middleware.replace(undefined, mw);
      }).should.throw();
      (function () {
        middleware.replace(null, mw);
      }).should.throw();
      (function () {
        middleware.replace('xxx', mw);
      }).should.throw();
      (function () {
        middleware.replace(123, mw);
      }).should.throw();
      (function () {
        middleware.replace({}, mw);
      }).should.throw();
    });
  });

  describe('remove', function () {

    it('should be exposed as a method', function () {
      middleware.should.have.property('remove');
      middleware.remove.should.be.a.Function;
    });

    it('should remove given middleware by function', function () {
      var mw = mocks.http.stack[2].handle,
        removed = middleware.remove(mw);
      mocks.http.stack.should.have.lengthOf(4);
      removed.should.equal(mw);
    });

    it('should remove given middleware by name', function () {
      var mw = mocks.http.stack[2].handle,
        removed = middleware.remove('three');
      mocks.http.stack.should.have.lengthOf(4);
      removed.should.equal(mw);
    });

    it('should throw on missing remove middleware', function () {
      var mw = function () {};
      (function () {
        middleware.remove();
      }).should.throw();
      (function () {
        middleware.remove(mw);
      }).should.throw();
      (function () {
        middleware.remove(undefined);
      }).should.throw();
      (function () {
        middleware.remove(null);
      }).should.throw();
      (function () {
        middleware.remove('xxx');
      }).should.throw();
      (function () {
        middleware.remove(123);
      }).should.throw();
      (function () {
        middleware.remove({});
      }).should.throw();
    });
  });

  describe('clear', function () {

    it('should be exposed as a method', function () {
      middleware.should.have.property('clear');
      middleware.clear.should.be.a.Function;
    });

    it('should remove all middleware', function () {
      middleware.clear();
      mocks.http.stack.should.have.lengthOf(0);
    });
  });
});

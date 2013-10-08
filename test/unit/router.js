var request = require('supertest'),
  should = require('should'),
  Sails = require('../../src'),

  sails = null,
  router = null,
  watchKey = null,
  watchCallback = null,
  usedMiddleware = null,
  mocks = null;

describe('router', function () {

  beforeEach(function () {

    watchKey = null;
    watchCallback = null;
    usedMiddleware = null;

    mocks = {
      config: {
        routes: {},
        watch: function (key, callback) {
          watchKey = key;
          watchCallback = callback;
        }
      },
      http: {
        router: {},
        routes: {},
        get: function () {
        }
      },
      middleware: {
        use: function (middleware) {
          usedMiddleware = middleware;
        }
      }
    };

    sails = new Sails();
    router = sails.container.get('router', mocks);
  });

  describe('reload', function () {

    it('should be exposed', function () {
      router.should.have.property('reload');
      router.reload.should.be.a.Function;
    });

    it('should compile routes from config', function () {
      var target = function () {};
      mocks.config.routes = {'get /': target};
      router.routes.should.have.lengthOf(0);
      router.reload();
      router.routes.should.have.lengthOf(1);
      router.routes[0].method.should.equal('get');
      router.routes[0].path.should.equal('/');
      router.routes[0].target.should.equal(target);
    });

    it('should emit a reload event after reloading', function (done) {
      var target = function () {};
      router.get('/', target);
      router.routes.should.have.lengthOf(0);
      router.on('reload', function () {
        router.routes.should.have.lengthOf(1);
        done();
      });
      router.reload();
    });

    it('should reuse routes that have been bound previously', function () {
      var target = function () {};
      mocks.config.routes = {'get /': function () {}};
      router.routes.should.have.lengthOf(0);
      router.reload();
      router.routes.should.have.lengthOf(1);
      router.get('/bound', target);
      router.reload();
      router.routes.should.have.lengthOf(2);
      router.routes[1].method.should.equal('get');
      router.routes[1].path.should.equal('/bound');
      router.routes[1].target.should.equal(target);
      router.reload();
      router.routes.should.have.lengthOf(2);
      router.routes[1].method.should.equal('get');
      router.routes[1].path.should.equal('/bound');
      router.routes[1].target.should.equal(target);
    });
  });

  describe('config watcher', function () {

    it('should watch the routes config key', function () {
      should.exist(watchKey);
      watchKey.should.equal('routes');
      should.exist(watchCallback);
    });

    it('should reload routes on change', function () {
      var target = function () {};
      router.get('/', target);
      router.routes.should.have.lengthOf(0);
      should.exist(watchCallback);
      watchCallback();
      router.routes.should.have.lengthOf(1);
    });
  });

  describe('middleware', function () {

    it('should be exposed as an alias to the express router', function () {
      router.should.have.property('middleware', mocks.http.router);
    });

    it('should be used', function () {
      router.middleware.should.equal(usedMiddleware);
    });
  });

  describe('filters', function () {

    it('should be exposed as an array property', function () {
      router.should.have.property('filters').with.lengthOf(0);
      router.filters.should.be.an.Array;
    });

    describe('api', function () {

      beforeEach(function () {
        router.filters = [
          function one () {},
          function two () {},
          function three () {},
          function four () {},
          function five () {},
        ];
      });
    
      describe('use', function () {

        it('should be exposed', function () {
          router.should.have.property('use');
          router.use.should.be.a.Function;
        });

        it('should throw on adding invalid filters', function () {
          (function () {
            router.use();
          }).should.throw();
          (function () {
            router.use(null);
          }).should.throw();
          (function () {
            router.use('xxx');
          }).should.throw();
          (function () {
            router.use(123);
          }).should.throw();
          (function () {
            router.use({});
          }).should.throw();
          (function () {
            router.use(new Error());
          }).should.throw();
        });

        it('should append filter if no index is given', function () {
          var filter = function () {};
          router.use(filter);
          router.filters.should.have.lengthOf(6);
          router.filters[5].should.equal(filter);
        });

        it('should insert filter at the given index', function () {
          var filter = function () {};
          router.use(filter, 3);
          router.filters.should.have.lengthOf(6);
          router.filters[3].should.equal(filter);
        });

        it('should throw on index greater than length', function () {
          var filter = function () {};
          (function () {
            router.use(filter, 6);
          }).should.throw();
        });

        it('should accept a negative index', function () {
          var filter = function () {};
          router.use(filter, -3);
          router.filters.should.have.lengthOf(6);
          router.filters[2].should.equal(filter);
        });

        it('should throw on index less than negative length', function () {
          var filter = function () {};
          (function () {
            router.use(filter, -6);
          }).should.throw();
        });
      });

      describe('appendFilter', function () {

        it('should be exposed', function () {
          router.should.have.property('appendFilter');
          router.appendFilter.should.be.a.Function;
        });

        it('should append filter', function () {
          var filter = function () {};
          router.appendFilter(filter);
          router.filters.should.have.lengthOf(6);
          router.filters[5].should.equal(filter);
        });
      });

      describe('prependFilter', function () {

        it('should be exposed', function () {
          router.should.have.property('prependFilter');
          router.prependFilter.should.be.a.Function;
        });

        it('should prepend filter', function () {
          var filter = function () {};
          router.prependFilter(filter);
          router.filters.should.have.lengthOf(6);
          router.filters[0].should.equal(filter);
        });
      });

      describe('insertFilterBefore', function () {

        it('should be exposed', function () {
          router.should.have.property('insertFilterBefore');
          router.insertFilterBefore.should.be.a.Function;
        });

        it('should insert filter before given filter function', function () {
          var filter = function () {};
          router.insertFilterBefore(router.filters[2], filter);
          router.filters.should.have.lengthOf(6);
          router.filters[2].should.equal(filter);
        });

        it('should insert filter before given filter name', function () {
          var filter = function () {};
          router.insertFilterBefore('three', filter);
          router.filters.should.have.lengthOf(6);
          router.filters[2].should.equal(filter);
        });

        it('should throw on missing before filter', function () {
          var filter = function () {};
          (function () {
            router.insertFilterBefore();
          }).should.throw();
          (function () {
            router.insertFilterBefore(filter);
          }).should.throw();
          (function () {
            router.insertFilterBefore(undefined, filter);
          }).should.throw();
          (function () {
            router.insertFilterBefore(null, filter);
          }).should.throw();
          (function () {
            router.insertFilterBefore('xxx', filter);
          }).should.throw();
          (function () {
            router.insertFilterBefore(123, filter);
          }).should.throw();
          (function () {
            router.insertFilterBefore({}, filter);
          }).should.throw();
        });
      });

      describe('insertFilterAfter', function () {

        it('should be exposed', function () {
          router.should.have.property('insertFilterAfter');
          router.insertFilterAfter.should.be.a.Function;
        });

        it('should insert filter before given filter function', function () {
          var filter = function () {};
          router.insertFilterAfter(router.filters[2], filter);
          router.filters.should.have.lengthOf(6);
          router.filters[3].should.equal(filter);
        });

        it('should insert filter before given filter name', function () {
          var filter = function () {};
          router.insertFilterAfter('three', filter);
          router.filters.should.have.lengthOf(6);
          router.filters[3].should.equal(filter);
        });

        it('should throw on missing before filter', function () {
          var filter = function () {};
          (function () {
            router.insertFilterAfter();
          }).should.throw();
          (function () {
            router.insertFilterAfter(filter);
          }).should.throw();
          (function () {
            router.insertFilterAfter(undefined, filter);
          }).should.throw();
          (function () {
            router.insertFilterAfter(null, filter);
          }).should.throw();
          (function () {
            router.insertFilterAfter('xxx', filter);
          }).should.throw();
          (function () {
            router.insertFilterAfter(123, filter);
          }).should.throw();
          (function () {
            router.insertFilterAfter({}, filter);
          }).should.throw();
        });
      });
    });
  });
});

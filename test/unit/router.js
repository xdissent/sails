var should = require('should'),
  sinon = require('sinon'),
  methods = require('express/node_modules/methods'),
  Sails = require('../../src'),
  sails = new Sails(),
  router = null,
  mocks = null;

describe('router', function () {

  beforeEach(function () {

    mocks = {
      config: {
        routes: {},
        watch: sinon.spy()
      },
      http: {
        router: {},
        routes: {}
      },
      middleware: {
        use: sinon.spy()
      }
    };

    methods.concat('all').forEach(function (method) {
      mocks.http[method] = sinon.spy(function (route) {
        mocks.http.routes[method] = (mocks.http.routes[method] || []).concat(route);
      });
    });

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
      mocks.config.watch.calledOnce.should.equal.true;
      mocks.config.watch.args[0][0].should.equal('routes');
    });

    it('should reload routes on change', function () {
      var target = function () {};
      router.get('/', target);
      router.routes.should.have.lengthOf(0);
      mocks.config.watch.args[0][1]();
      router.routes.should.have.lengthOf(1);
    });
  });

  describe('middleware', function () {

    it('should be exposed as an alias to the express router', function () {
      router.should.have.property('middleware', mocks.http.router);
    });

    it('should be used', function () {
      mocks.middleware.use.called.should.equal.true;
    });
  });

  describe('filters', function () {

    it('should be exposed as an array property', function () {
      router.should.have.property('filters').with.lengthOf(0);
      router.filters.should.be.an.Array;
    });

    it('should be executed when reloading', function () {
      router.filters = [sinon.spy()];
      router.reload();
      router.filters[0].calledOnce.should.equal.true;
      router.filters[0].args[0][0].should.be.an.Array;
    });

    it('should receive an array of routes', function () {
      router.filters = [sinon.spy()];
      router.get('/', {});
      router.reload();
      router.filters[0].calledOnce.should.equal.true;
      router.filters[0].args[0][0].should.be.an.Array;
      router.filters[0].args[0][0].should.have.lengthOf(1);
    });

    it('should be able to add routes', function () {
      router.filters = [sinon.stub().returns([
        {method: 'get', path: '/add1', target: {}, name: 'add1'},
        {method: 'get', path: '/add2', target: {}, name: 'add2'},
      ])];
      router.reload();
      router.routes.should.have.lengthOf(2);
    });

    it('should be able to remove routes', function () {
      router.get('/rem1', {});
      router.get('/rem2', {});
      router.filters = [sinon.stub().returns([])];
      router.reload();
      router.routes.should.have.lengthOf(0);
    });

    it('should be executed in order', function () {
      router.filters = [sinon.spy(), sinon.spy()];
      router.reload();
      router.filters[0].calledOnce.should.equal.true;
      router.filters[1].calledOnce.should.equal.true;
      router.filters[0].calledBefore(router.filters[1]).should.equal.true;
    });

    it('should be receive routes from previous filters', function () {
      var route = {method: 'get', path: '/', target: {}, name: 'route'};
      router.filters = [sinon.stub().returns([route]), sinon.spy()];
      router.reload();
      router.filters[0].calledOnce.should.equal.true;
      router.filters[1].calledOnce.should.equal.true;
      router.filters[1].args[0][0].should.be.an.Array;
      router.filters[1].args[0][0].should.have.lengthOf(1);
      router.filters[1].args[0][0][0].should.equal(route);
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

        it('should be exposed as a method', function () {
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

        it('should be exposed as a method', function () {
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

        it('should be exposed as a method', function () {
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

        it('should be exposed as a method', function () {
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

        it('should be exposed as a method', function () {
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

  describe('clear', function () {

    it('should be exposed as a method', function () {
      router.should.have.property('clear');
      router.clear.should.be.a.Function;
    });

    it('should remove all routes from the router', function () {
      router.routes.should.have.lengthOf(0);
      router.route('get', '/one', function () {});
      router.route('post', '/two', function () {});
      router.route('put', '/three', function () {});
      router.reload();
      router.routes.should.have.lengthOf(3);
      router.clear();
      router.routes.should.have.lengthOf(0);
    });

    it('should remove all routes from the express router', function () {
      router.routes.should.have.lengthOf(0);
      router.route('get', '/one', function () {});
      router.route('post', '/two', function () {});
      router.route('put', '/three', function () {});
      router.reload();
      mocks.http.routes.get.should.have.lengthOf(1);
      mocks.http.routes.post.should.have.lengthOf(1);
      mocks.http.routes.put.should.have.lengthOf(1);
      router.clear();
      mocks.http.routes.get.should.have.lengthOf(0);
      mocks.http.routes.post.should.have.lengthOf(0);
      mocks.http.routes.put.should.have.lengthOf(0);
    });
  });

  describe('route', function () {

    it('should be exposed as a method', function () {
      router.should.have.property('route');
      router.route.should.be.a.Function;
    });

    it('should not cause routes to reload', function () {
      router.routes.should.have.lengthOf(0);
      router.route('get', '/', function () {});
      router.routes.should.have.lengthOf(0);
      router.reload();
      router.routes.should.have.lengthOf(1);
    });

    describe('shortcuts', function () {

      methods.concat('all').forEach(function (method) {
        describe(method, function () {
          it('should be exposed as a method', function () {
            router.should.have.property(method);
            router[method].should.be.a.Function;
          });

          it('should call route with the ' + method + ' method', function () {
            sinon.spy(router, 'route');
            router.route.calledOnce.should.equal.true;
          });
        });
      });
    });
  });

  describe('unroute', function () {

    beforeEach(function () {
      router.route('get', '/one', function () {}, 'one');
      router.route('post', '/two', function () {}, 'two');
      router.route('put', '/three', function () {}, 'three');
      router.reload();
    });

    it('should be exposed as a method', function () {
      router.should.have.property('unroute');
      router.unroute.should.be.a.Function;
    });

    it('should not cause routes to reload', function () {
      router.unroute();
      router.routes.should.have.lengthOf(3);
      router.reload();
      router.routes.should.have.lengthOf(0);
    });

    it('should remove all routes if no criteria are given', function () {
      router.unroute();
      router.reload();
      router.routes.should.have.lengthOf(0);
    });

    it('should remove routes by method', function () {
      router.unroute({method: 'post'});
      router.reload();
      router.routes.should.have.lengthOf(2);
    });

    it('should remove routes by name', function () {
      router.unroute({name: 'two'});
      router.reload();
      router.routes.should.have.lengthOf(2);
    });

    it('should remove routes by path', function () {
      router.unroute({path: '/two'});
      router.reload();
      router.routes.should.have.lengthOf(2);
    });

    it('should remove routes by as a single argument', function () {
      router.unroute('two');
      router.reload();
      router.routes.should.have.lengthOf(2);
    });

    it('should accept a filter function', function () {
      router.unroute(function (route) {
        return route.name === 'three';
      });
      router.reload();
      router.routes.should.have.lengthOf(2);
    });

    it('should accept a this object for the filter function', function () {
      var obj = {};
      router.unroute(function (route) {
        this.should.equal(obj);
        return route.name === 'three';
      }, obj);
    });
  });
});

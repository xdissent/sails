var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null;

describe('views', function() {

  before(function (done) {
    sails = new Sails({
      appPath: path.resolve(__dirname, '../fixtures/views'),
      hooks: ['views'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/view/routes/string/implicit': 'home',
        '/view/routes/string/explicit': 'home/index',
        '/view/routes/object/implicit': {view: 'home'},
        '/view/routes/object/explicit': {view: 'home/index'},
        '/view/routes/missing': 'missing/view',
        '/view/helper/defined': function (req, res, next) {
          if (typeof res.view === 'function') return res.send(200, 'OK');
          next(new Error('FAIL'));
        },
        '/view/helper/req/view': function (req, res, next) {
          req.target = {view: 'home'};
          res.view();
        },
        '/view/helper/req/view/subview': function (req, res, next) {
          req.target = {view: 'home/index'};
          res.view();
        },
        '/view/helper/args/view': function (req, res, next) {
          res.view('home');
        },
        '/view/helper/args/view/subview': function (req, res, next) {
          res.view('home/index');
        },
        '/view/helper/locals': function (req, res, next) {
          res.locals = {test: '123'};
          res.view('home/index');
        },
        '/view/helper/data': function (req, res, next) {
          res.view('home/index', {test: '123'});
        },
        '/view/helper/override': function (req, res, next) {
          res.locals = {test: '123'};
          res.view('home/index', {test: '456'});
        },
        '/view/helper/callback': function (req, res, next) {
          res.view('home/index', function (err, rendered) {
            if (!err) return res.send(200, 'OK');
            next(err);
          });
        },
        '/view/helper/callback/rendered': function (req, res, next) {
          res.view('home/index', function (err, rendered) {
            if (!err && /LAYOUT[\s\S]*HOME/.test(rendered)) return res.send(200, 'OK');
            next(err || new Error('FAIL'));
          });
        },
        '/view/helper/callback/error': function (req, res, next) {
          res.view('___FAIL___', function (err, rendered) {
            if (err) return res.send(200, 'OK');
            next(new Error('FAIL'));
          });
        },
        '/view/helper/order': function (req, res, next) {
          res.view({test: '123'}, 'home/index');
        },
        '/view/helper/layout/true': function (req, res, next) {
          res.view('home/index', {layout: true});
        },
        '/view/helper/layout/false': function (req, res, next) {
          res.view('home/index', {layout: false});
        },
        '/view/helper/layout/explicit': function (req, res, next) {
          res.view('home/index', {layout: 'other.ejs'});
        },
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  describe('response view helper', function () {
    it('should define the view helper on the response object', function (done) {
      request(sails.server)
        .get('/view/helper/defined')
        .expect(/OK/)
        .expect(200, done);
    });

    it('should render the view specified by req.view without an explicit subview', function (done) {
      request(sails.server)
        .get('/view/helper/req/view')
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(200, done);
    });

    it('should render the view specified by req.view with an explicit subview', function (done) {
      request(sails.server)
        .get('/view/helper/req/view/subview')
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(200, done);
    });

    it('should render the view specified via arguments without an explicit subview', function (done) {
      request(sails.server)
        .get('/view/helper/args/view')
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(200, done);
    });

    it('should render the view specified via arguments with an explicit subview', function (done) {
      request(sails.server)
        .get('/view/helper/args/view/subview')
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(200, done);
    });

    it('should expose res.locals to the view', function (done) {
      request(sails.server)
        .get('/view/helper/locals')
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(/123/)
        .expect(200, done);
    });

    it('should expose data from arguments to the view', function (done) {
      request(sails.server)
        .get('/view/helper/data')
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(/123/)
        .expect(200, done);
    });

    it('should override res.locals with data from arguments', function (done) {
      request(sails.server)
        .get('/view/helper/override')
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(/456/)
        .expect(200, done);
    });

    it('should not render if given a callback', function (done) {
      request(sails.server)
        .get('/view/helper/callback')
        .expect(/OK/)
        .expect(200, done);
    });

    it('should pass the rendered view to a callback', function (done) {
      request(sails.server)
        .get('/view/helper/callback/rendered')
        .expect(/OK/)
        .expect(200, done);
    });

    it('should pass any errors to a callback', function (done) {
      request(sails.server)
        .get('/view/helper/callback/error')
        .expect(/OK/)
        .expect(200, done);
    });

    it('should accept arguments in reverse order', function (done) {
      request(sails.server)
        .get('/view/helper/order')
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(/123/)
        .expect(200, done);
    });

    it('should render the default layout if layout is true in data argument', function (done) {
      request(sails.server)
        .get('/view/helper/layout/true')
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(200, done);
    });

    it('should not render a layout if layout is false in data argument', function (done) {
      request(sails.server)
        .get('/view/helper/layout/false')
        .expect(/^(?!LAYOUT)HOME/)
        .expect(200, done);
    });

    it('should render the layout explicitly set in data argument', function (done) {
      request(sails.server)
        .get('/view/helper/layout/explicit')
        .expect(/HOME/)
        .expect(/OTHER/)
        .expect(200, done);
    });
  });

  describe('routes', function () {
    it('should render the index view for a string route without an explicit subview', function (done) {
      request(sails.server)
        .get('/view/routes/string/implicit')
        .expect('Content-Type', /html/)
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(200, done);
    });

    it('should render the specified view for a string route with an explicit subview', function (done) {
      request(sails.server)
        .get('/view/routes/string/explicit')
        .expect('Content-Type', /html/)
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(200, done);
    });

    it('should render the index view for an object route without an explicit subview', function (done) {
      request(sails.server)
        .get('/view/routes/object/implicit')
        .expect('Content-Type', /html/)
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(200, done);
    });

    it('should render the specified view for an object route with an explicit subview', function (done) {
      request(sails.server)
        .get('/view/routes/object/explicit')
        .expect('Content-Type', /html/)
        .expect(/HOME/)
        .expect(/LAYOUT/)
        .expect(200, done);
    });

    it('should respond with a 404 if a view is missing', function (done) {
      request(sails.server)
        .get('/view/missing')
        .expect(404, done);
    });
  });
});
var request = require('supertest'),
  path = require('path'),
  Sails = require('../../src'),
  sails = null, server = null;

before(function (done) {
  sails = new Sails({appPath: path.resolve(__dirname, '../fixtures/views')});
  server = sails.container.get('server');
  server.listen(0, 'localhost', done);
});

after(function (done) {
  server.close(done);
});

// // Old sails:
// var request = require('supertest'),
//   path = require('path'),
//   Sails = require('../../lib/app'),
//   sails = null, server = null;

// before(function (done) {
//   sails = new Sails();
//   sails.lift({appPath: path.resolve(__dirname, '../fixtures/views')}, function () {
//     server = sails.express.server;
//     done();
//   });
// });

// after(function (done) {
//   sails.lower(done);
// });

describe('response view helper', function () {
  it('should define the view helper on the response object', function (done) {
    request(server)
      .get('/view/helper/defined')
      .expect(/OK/)
      .expect(200, done);
  });

  it('should render the view specified by req.view without an explicit subview', function (done) {
    request(server)
      .get('/view/helper/req/view')
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(200, done);
  });

  it('should render the view specified by req.view with an explicit subview', function (done) {
    request(server)
      .get('/view/helper/req/view/subview')
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(200, done);
  });

  it('should render the view specified via arguments without an explicit subview', function (done) {
    request(server)
      .get('/view/helper/args/view')
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(200, done);
  });

  it('should render the view specified via arguments with an explicit subview', function (done) {
    request(server)
      .get('/view/helper/args/view/subview')
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(200, done);
  });

  it('should expose res.locals to the view', function (done) {
    request(server)
      .get('/view/helper/locals')
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(/123/)
      .expect(200, done);
  });

  it('should expose data from arguments to the view', function (done) {
    request(server)
      .get('/view/helper/data')
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(/123/)
      .expect(200, done);
  });

  it('should override res.locals with data from arguments', function (done) {
    request(server)
      .get('/view/helper/override')
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(/456/)
      .expect(200, done);
  });

  it('should not render if given a callback', function (done) {
    request(server)
      .get('/view/helper/callback')
      .expect(/OK/)
      .expect(200, done);
  });

  it('should pass the rendered view to a callback', function (done) {
    request(server)
      .get('/view/helper/callback/rendered')
      .expect(/OK/)
      .expect(200, done);
  });

  it('should pass any errors to a callback', function (done) {
    request(server)
      .get('/view/helper/callback/error')
      .expect(/OK/)
      .expect(200, done);
  });

  it('should accept arguments in reverse order', function (done) {
    request(server)
      .get('/view/helper/order')
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(/123/)
      .expect(200, done);
  });

  it('should render the default layout if layout is true in data argument', function (done) {
    request(server)
      .get('/view/helper/layout/true')
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(200, done);
  });

  it('should not render a layout if layout is false in data argument', function (done) {
    request(server)
      .get('/view/helper/layout/false')
      .expect(/^(?!LAYOUT)HOME/)
      .expect(200, done);
  });

  it('should render the layout explicitly set in data argument', function (done) {
    request(server)
      .get('/view/helper/layout/explicit')
      .expect(/HOME/)
      .expect(/OTHER/)
      .expect(200, done);
  });
});

describe('view routes', function () {
  it('should render the index view for a string route without an explicit subview', function (done) {
    request(server)
      .get('/view/routes/string/implicit')
      .expect('Content-Type', /html/)
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(200, done);
  });

  it('should render the specified view for a string route with an explicit subview', function (done) {
    request(server)
      .get('/view/routes/string/explicit')
      .expect('Content-Type', /html/)
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(200, done);
  });

  it('should render the index view for an object route without an explicit subview', function (done) {
    request(server)
      .get('/view/routes/object/implicit')
      .expect('Content-Type', /html/)
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(200, done);
  });

  it('should render the specified view for an object route with an explicit subview', function (done) {
    request(server)
      .get('/view/routes/object/explicit')
      .expect('Content-Type', /html/)
      .expect(/HOME/)
      .expect(/LAYOUT/)
      .expect(200, done);
  });

  it('should respond with a 404 if a view is missing', function (done) {
    request(server)
      .get('/view/missing')
      .expect(404, done);
  });
});
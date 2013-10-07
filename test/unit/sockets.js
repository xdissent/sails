var request = require('supertest'),
  Sails = require('../../src'),
  sails = null,
  io = require('socket.io/node_modules/socket.io-client'),
  socket = null;

function connect (res) {
  var cookie = res.headers['set-cookie'] ? encodeURIComponent(res.headers['set-cookie'][0]) : '';
  return io.connect('http://' + res.req._headers.host + '?cookie=' + cookie);
}

describe('sockets', function () {

  before(function (done) {
    sails = new Sails({
      hooks: ['cookies', 'session', 'sockets'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/': function (req, res, next) {
          res.send(200, 'OK');
        }
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  describe('socket.io', function () {

    it('should connect if a session exists', function (done) {
      request(sails.server)
        .get('/')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          socket = connect(res);
          socket.on('error', done);
          socket.on('connect', function () {
            socket.disconnect()
            done();
          });
        });
    });
  });
});
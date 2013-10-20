var request = require('supertest'),
  should = require('should'),
  Sails = require('../../src'),
  sails = null,
  io = require('socket.io/node_modules/socket.io-client'),
  socket = null;

function connect (res) {
  var cookie = res.headers['set-cookie'] ? encodeURIComponent(res.headers['set-cookie'][0]) : '';
  return io.connect('http://' + res.req._headers.host + '?cookie=' + cookie, {'force new connection': true});
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

  describe('socket.io client', function () {

    it('should connect if a session exists', function (done) {
      request(sails.server)
        .get('/')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          socket = connect(res);
          socket.on('error', done);
          socket.on('connect', function () {
            socket.disconnect();
            done();
          });
        });
    });

    it('should not connect if a session does not exist', function (done) {
      socket = connect({headers: {}, req: {_headers: {host: ''}}});
      socket.on('error', function (err) {
        done();
      });
    });

    it('should be able to send requests', function (done) {
      request(sails.server)
        .get('/')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          socket = connect(res);
          socket.on('error', done);
          socket.on('connect', function () {
            socket.emit('request', 'get', '/', null, null, function (status, headers, body) {
              should.exist(status);
              status.should.equal(200);
              should.exist(headers);
              headers.should.be.an.Object;
              should.exist(body);
              body.should.be.a.String;
              body.should.equal('OK');
              socket.disconnect();
              done();
            });
          });
        });
    });
  });
});
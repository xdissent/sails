var request = require('supertest'),
  should = require('should'),
  Sails = require('../../src'),
  sails = null,
  io = require('socket.io/node_modules/socket.io-client');

function connect (done) {
  request(sails.server)
    .get('/')
    .expect(200)
    .end(function (err, res) {
      if (err) return done(err);
      var cookie = res.headers['set-cookie'] ? encodeURIComponent(res.headers['set-cookie'][0]) : '';
      done(null, io.connect('http://' + res.req._headers.host + '?cookie=' + cookie, {'force new connection': true}));
    });
}

function socketRequest (method, url, body, headers, done) {
  connect(function (err, socket) {
    if (err) return done(err);
    socket.on('error', done);
    socket.on('connect', function () {
      socket.emit('request', method, url, body, headers, function (status, headers, body) {
        done.apply(null, [null, socket].concat(arguments));
      });
    });
  });
}

describe('pubsub', function () {

  before(function (done) {
    sails = new Sails({
      hooks: ['cookies', 'session', 'sockets', 'pubsub'],
      server: {port: 0, host: 'localhost'},
      routes: {
        '/': function (req, res, next) {
          res.send(200, 'OK');
        },
        '/subscribe/:room': function (req, res, next) {
          req.subscribe(req.params.room);
          res.send(200, 'OK');
        },
        '/subscribed/:room': function (req, res, next) {
          var subs = sails.hooks.pubsub.subscribers(req.params.room);
          for (var i = 0; i < subs.length; i++) {
            if (subs[i] === req.socket) return res.send(200, 'OK');
          };
          next(new Error('FAIL'));
        },
        '/unsubscribe/:room': function (req, res, next) {
          req.unsubscribe(req.params.room);
          res.send(200, 'OK');
        },
        '/publish/:room/:message': function (req, res, next) {
          req.publish(req.params.room, req.params.message);
          res.send(200, 'OK');
        },
        '/broadcast/:room/:message': function (req, res, next) {
          req.broadcast(req.params.room, req.params.message);
          res.send(200, 'OK');
        }
      }
    });
    sails.lift(done);
  });

  after(function (done) {
    sails.lower(done);
  });

  describe('req helpers', function () {

    describe('subscribe', function () {

      it('should subscribe the socket to the room', function (done) {
        connect(function (err, socket) {
          if (err) return done(err);
          socket.on('error', done);
          socket.on('connect', function () {
            socket.emit('request', 'get', '/subscribe/test', null, null, function (status, headers, body) {
              socket.emit('request', 'get', '/subscribed/test', null, null, function (status, headers, body) {
                socket.disconnect();
                should.exist(status);
                status.should.equal(200);
                done();
              });
            });
          });
        })
      });
    });

    describe('unsubscribe', function () {

      it('should unsubscribe the socket from the room', function (done) {
        connect(function (err, socket) {
          if (err) return done(err);
          socket.on('error', done);
          socket.on('connect', function () {
            socket.emit('request', 'get', '/subscribe/test', null, null, function (status, headers, body) {
              socket.emit('request', 'get', '/unsubscribe/test', null, null, function (status, headers, body) {
                socket.emit('request', 'get', '/subscribed/test', null, null, function (status, headers, body) {
                  socket.disconnect();
                  should.exist(status);
                  status.should.equal(500);
                  done();
                });
              });
            });
          });
        })
      });
    });

    describe('publish', function () {

      it('should publish a message sockets subscribed to the room', function (done) {
        var msg = 'PUBLISHED';
        connect(function (err, socket1) {
          if (err) return done(err);
          socket1.on('error', done);
          socket1.on('connect', function () {
            socket1.emit('request', 'get', '/subscribe/test', null, null, function (status, headers, body) {
              connect(function (err, socket2) {
                if (err) {
                  socket1.disconnect();
                  return done(err);
                }
                socket2.on('error', function (err) {
                  socket1.disconnect();
                  done(err);
                });
                socket2.on('connect', function () {
                  socket2.emit('request', 'get', '/publish/test/' + msg, null, null, function () {
                    socket2.disconnect();
                  });
                });
              });
            });
          });
          socket1.on('message', function (message) {
            should.exist(message);
            message.should.equal(msg);
            socket1.disconnect();
            done();
          });
        })
      });

      it('should not publish to the originating socket', function (done) {
        var msg = 'PUBLISHED';
        connect(function (err, socket) {
          if (err) return done(err);
          socket.on('error', done);
          socket.on('connect', function () {
            socket.emit('request', 'get', '/subscribe/test', null, null, function (status, headers, body) {
              socket.emit('request', 'get', '/publish/test/' + msg, null, null, function (status, headers, body) {
                socket.disconnect();
                done();
              });
            });
          });
          socket.on('message', function (message) {
            done(new Error('Should not have receieved a message'));
          });
        })
      });
    });

    describe('broadcast', function () {

      it('should broadcast a message sockets subscribed to the room', function (done) {
        var msg = 'BROADCASTED';
        connect(function (err, socket1) {
          if (err) return done(err);
          socket1.on('error', done);
          socket1.on('connect', function () {
            socket1.emit('request', 'get', '/subscribe/test', null, null, function (status, headers, body) {
              connect(function (err, socket2) {
                if (err) {
                  socket1.disconnect();
                  return done(err);
                }
                socket2.on('error', function (err) {
                  socket1.disconnect();
                  done(err);
                });
                socket2.on('connect', function () {
                  socket2.emit('request', 'get', '/broadcast/test/' + msg, null, null, function () {
                    socket2.disconnect();
                  });
                });
              });
            });
          });
          socket1.on('message', function (message) {
            should.exist(message);
            message.should.equal(msg);
            socket1.disconnect();
            done();
          });
        })
      });

      it('should broadcast to the originating socket', function (done) {
        var msg = 'BROADCASTED';
        connect(function (err, socket) {
          if (err) return done(err);
          socket.on('error', done);
          socket.on('connect', function () {
            socket.emit('request', 'get', '/subscribe/test', null, null, function (status, headers, body) {
              socket.emit('request', 'get', '/broadcast/test/' + msg, null, null, function () {});
            });
          });
          socket.on('message', function (message) {
            should.exist(message);
            message.should.equal(msg);
            socket.disconnect();
            done();
          });
        })
      });
    });
  });
});
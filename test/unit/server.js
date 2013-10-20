var path = require('path'),
  should = require('should'),
  sinon = require('sinon'),
  Sails = require('../../src'),
  sails = new Sails(),
  server = null,
  mocks = null,
  key =  path.resolve(__dirname, '../fixtures/server/key.pem'),
  cert =  path.resolve(__dirname, '../fixtures/server/cert.pem');

httpServer = require('http').Server;
httpsServer = require('https').Server;

describe('server', function () {

  beforeEach(function () {

    mocks = {
      config: {watch: sinon.spy()},
      http: sinon.spy(),
      middleware: {use: sinon.spy()}
    };

    sinon.stub(httpServer.prototype, 'listen', function () { this.emit('listening'); });
    sinon.stub(httpServer.prototype, 'close', function () { this.emit('close'); });
    sinon.stub(httpsServer.prototype, 'listen', function () { this.emit('listening'); });
    sinon.stub(httpsServer.prototype, 'close', function () { this.emit('close'); });

    server = sails.container.get('server', mocks);
  });

  afterEach(function () {
    httpServer.prototype.listen.restore();
    httpServer.prototype.close.restore();
    httpsServer.prototype.listen.restore();
    httpsServer.prototype.close.restore();
  });

  it('should be an instance of http.Server by default', function () {
    server.should.be.instanceOf(httpServer);
  });

  it('should be use the express app as the request handler', function () {
    var listeners = server.listeners('request');
    listeners.should.have.lengthOf(1);
    listeners[0].should.equal(mocks.http);
  });

  it('should be an instance of https.Server if key and cert are present in config', function () {
    mocks.config.server = {key: key, cert: cert};
    server = sails.container.get('server', mocks);
    server.should.be.instanceOf(httpsServer);
  });

  describe('listen', function () {

    it('should be exposed as a method', function () {
      server.should.have.property('listen');
      server.listen.should.be.a.Function;
    });

    it('should call base server listen method', function () {
      server.listen();
      httpServer.prototype.listen.calledOnce.should.be.true;
    });

    it('should use specified args if first argument is a socket path', function () {
      server.listen('/dev/null');
      httpServer.prototype.listen.calledOnce.should.be.true;
      httpServer.prototype.listen.args[0].should.have.lengthOf(1);
      httpServer.prototype.listen.args[0][0].should.equal('/dev/null');
    });

    it('should use specified args if first argument is a handle', function () {
      var handle = {_handle: {}};
      server.listen(handle);
      httpServer.prototype.listen.calledOnce.should.be.true;
      httpServer.prototype.listen.args[0].should.have.lengthOf(1);
      httpServer.prototype.listen.args[0][0].should.equal(handle);
    });

    it('should use default port and host if not given', function () {
      server.listen();
      httpServer.prototype.listen.calledOnce.should.be.true;
      httpServer.prototype.listen.args[0].should.have.lengthOf(2);
      httpServer.prototype.listen.args[0][0].should.equal(1337);
      httpServer.prototype.listen.args[0][1].should.equal('localhost');
    });

    it('should use default port and host if only callback given', function () {
      var listening = function () {};
      server.listen(listening);
      httpServer.prototype.listen.calledOnce.should.be.true;
      httpServer.prototype.listen.args[0].should.have.lengthOf(2);
      httpServer.prototype.listen.args[0][0].should.equal(1337);
      httpServer.prototype.listen.args[0][1].should.equal('localhost');
    });

    it('should use default host if only port specified', function () {
      server.listen(666);
      httpServer.prototype.listen.calledOnce.should.be.true;
      httpServer.prototype.listen.args[0].should.have.lengthOf(2);
      httpServer.prototype.listen.args[0][0].should.equal(666);
      httpServer.prototype.listen.args[0][1].should.equal('localhost');
    });

    it('should use specified port and host', function () {
      server.listen(666, 'other');
      httpServer.prototype.listen.calledOnce.should.be.true;
      httpServer.prototype.listen.args[0].should.have.lengthOf(2);
      httpServer.prototype.listen.args[0][0].should.equal(666);
      httpServer.prototype.listen.args[0][1].should.equal('other');
    });

    it('should use default host if only port and backlog given', function () {
      server.listen(666, 512);
      httpServer.prototype.listen.calledOnce.should.be.true;
      httpServer.prototype.listen.args[0].should.have.lengthOf(3);
      httpServer.prototype.listen.args[0][0].should.equal(666);
      httpServer.prototype.listen.args[0][1].should.equal('localhost');
    });

    describe('with config', function () {

      beforeEach(function () {
        mocks.config.server = {port: 777, host: 'other'};
        server = sails.container.get('server', mocks);
      });

      it('should use config port and host if not given', function () {
        server.listen();
        httpServer.prototype.listen.calledOnce.should.be.true;
        httpServer.prototype.listen.args[0].should.have.lengthOf(2);
        httpServer.prototype.listen.args[0][0].should.equal(777);
        httpServer.prototype.listen.args[0][1].should.equal('other');
      });

      it('should use config port and host if only callback given', function () {
        var listening = function () {};
        server.listen(listening);
        httpServer.prototype.listen.calledOnce.should.be.true;
        httpServer.prototype.listen.args[0].should.have.lengthOf(2);
        httpServer.prototype.listen.args[0][0].should.equal(777);
        httpServer.prototype.listen.args[0][1].should.equal('other');
      });

      it('should use config host if only port specified', function () {
        server.listen(666);
        httpServer.prototype.listen.calledOnce.should.be.true;
        httpServer.prototype.listen.args[0].should.have.lengthOf(2);
        httpServer.prototype.listen.args[0][0].should.equal(666);
        httpServer.prototype.listen.args[0][1].should.equal('other');
      });

      it('should use specified port and host', function () {
        server.listen(666, 'another');
        httpServer.prototype.listen.calledOnce.should.be.true;
        httpServer.prototype.listen.args[0].should.have.lengthOf(2);
        httpServer.prototype.listen.args[0][0].should.equal(666);
        httpServer.prototype.listen.args[0][1].should.equal('another');
      });

      it('should use config host if only port and backlog given', function () {
        server.listen(666, 512);
        httpServer.prototype.listen.calledOnce.should.be.true;
        httpServer.prototype.listen.args[0].should.have.lengthOf(3);
        httpServer.prototype.listen.args[0][0].should.equal(666);
        httpServer.prototype.listen.args[0][1].should.equal('other');
      });
    });

    it('should call the listening callback on listening', function () {
      var listening = sinon.spy();
      server.listen(listening);
      listening.calledOnce.should.be.true;
      listening.args[0].should.have.lengthOf(0);
    });

    it('should call the listening callback on error', function () {
      var err = new Error();
      httpServer.prototype.listen.restore();
      sinon.stub(httpServer.prototype, 'listen', function () {
        this.emit('error', err);
      });
      var listening = sinon.spy();
      server.listen(listening);
      listening.calledOnce.should.be.true;
      listening.args[0].should.have.lengthOf(1);
      listening.args[0][0].should.equal(err);
    });

    it('should throw on error if no callback provided', function () {
      var err = new Error();
      httpServer.prototype.listen.restore();
      sinon.stub(httpServer.prototype, 'listen', function () {
        this.emit('error', err);
      });
      (function () {
        server.listen();
      }).should.throw(err);
    });
  });

  describe('close', function () {

    it('should be exposed as a method', function () {
      server.should.have.property('close');
      server.close.should.be.a.Function;
    });

    it('should throw if not listening and no callback provided', function () {
      (function () {
        server.close();
      }).should.throw();
    });

    it('should call callback with error if not listening', function () {
      server.close(function (err) {
        should.exist(err);
      });
    });

    it('should call base server close method', function () {
      server.listen();
      server.close();
      httpServer.prototype.close.calledOnce.should.be.true;
    });

    it('should call callback when closed', function () {
      var closed = sinon.spy();
      server.listen();
      server.close(closed);
      closed.calledOnce.should.be.true;
      closed.args[0].should.have.lengthOf(0);
    });

    it('should call the closed callback with an error', function () {
      var err = new Error();
      httpServer.prototype.close.restore();
      sinon.stub(httpServer.prototype, 'close', function () {
        this.emit('error', err);
      });
      var closed = sinon.spy();
      server.listen();
      server.close(closed);
      closed.calledOnce.should.be.true;
      closed.args[0].should.have.lengthOf(1);
      closed.args[0][0].should.equal(err);
    });

    it('should throw on error if no callback provided', function () {
      var err = new Error();
      httpServer.prototype.close.restore();
      sinon.stub(httpServer.prototype, 'close', function () {
        this.emit('error', err);
      });
      server.listen();
      (function () {
        server.close();
      }).should.throw(err);
    });
  });
});
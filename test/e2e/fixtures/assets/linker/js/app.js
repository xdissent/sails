
var socket = null,
  expected = null;

function result(msg) {
  document.getElementById('result').innerHTML = msg;
}

function debug(msg) {
  document.getElementById('debug').innerHTML = JSON.stringify(msg);
}

function connect() {
  socket = io.connect('http://localhost:1337');
  socket.on('connect', function () {
    result('connected');
  });
}

function widgetList() {
  socket.get('/widget', function (message) {
    result('listed');
    debug(message);
  });
}

function widgetCreate() {
  socket.post('/widget', function (message) {
    result('created');
    debug(message);
  });
}

function widgetUpdate() {
  socket.put('/widget/1', function (message) {
    result('updated');
    debug(message);
  });
}

function widgetDestroy() {
  socket['delete']('/widget/1', function (message) {
    result('destroyed');
    debug(message);
  });
}
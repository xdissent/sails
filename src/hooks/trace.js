var trace = require('express-trace');

module.exports = function (http) {
  trace(http);
};
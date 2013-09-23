var express = require('express');

module.exports = function (environment) {
  var http = express();
  http.set('env', environment);
  return http;
}
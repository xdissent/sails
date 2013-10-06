var express = require('express');

module.exports = function (config, middleware) {
  var bodyParser = express.bodyParser();
  middleware.prepend(bodyParser);
  return bodyParser;
};
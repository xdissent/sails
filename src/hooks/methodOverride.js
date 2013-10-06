var express = require('express');

module.exports = function (middleware, bodyParser) {
  var methodOverride = express.methodOverride();
  middleware.insertAfter(bodyParser, methodOverride);
  return methodOverride;
};
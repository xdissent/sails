var express = require('express');

module.exports = function (middleware, bodyParser) {
  var methodOverride = express.methodOverride();
  middleware.insert_after(bodyParser, methodOverride);
  return methodOverride;
};
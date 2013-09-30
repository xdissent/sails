var express = require('express');

module.exports = function (config, middleware, http) {
  var cookies = express.cookieParser(config.cookies.secret);
  middleware.prepend(cookies);
  return cookies;
};
var express = require('express');

module.exports = function (config, middleware) {  
  var cookies = express.cookieParser(config.cookies.secret);
  middleware.prepend(cookies);
  return cookies;
};
var express = require('express');

module.exports = function (config, middleware, cookies) {  
  var session = express.session(config.session);
  middleware.insert_after(cookies, session);
  return session;
};
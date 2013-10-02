var express = require('express');

module.exports = function (config, middleware, session) {
  middleware.insertAfter(session.middleware, csrf);
  return csrf;

  function csrf (req, res, next) {
    if (!config.csrf) return next();
    if (typeof res.locals._csrf === 'undefined') {
      res.locals._csrf = req.session._csrf;
    }
    return express.csrf()(req, res, next);
  }
};
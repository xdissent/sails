var express = require('express');

module.exports = function (config, middleware, session, log) {

  log = log.namespace('csrf');

  middleware.insertAfter(session.middleware, csrf);
  return csrf;

  function csrf (req, res, next) {
    if (!config.csrf) return next();

    res.locals.csrfToken = function csrfToken () {
      return res.locals._csrf || (res.locals._csrf = req.csrfToken());
    };

    return express.csrf()(req, res, next);
  }
};
var express = require('express');

module.exports = function (config, middleware, http) {
  middleware.prepend(bodyParser);
  return bodyParser;

  function bodyParser (req, res, next) {
    if (req.bodyParserDisabled) {
      return next();
    }
    return express.bodyParser()(req, res, next);
  }
};
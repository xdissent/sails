var express = require('express');

module.exports = function (config, middleware, router) {
  var staticFiles = express['static'](config.paths['public'], {
    maxAge: config.cache.maxAge
  });
  middleware.insertAfter(router.middleware, staticFiles);
  return staticFiles;
};
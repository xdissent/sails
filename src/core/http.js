var express = require('express'),
  _ = require('lodash');

module.exports = function (environment, config, log) {
  
  log = log.namespace('http');

  var http = express(),
    _config = {};

  http.set('env', environment);
  http.disable('x-powered-by');
  
  reload();
  config.watch('http', function () {
    log.verbose('HTTP config changed');
    reload();
  });
  return http;

  function reload () {
    log.verbose('Reloading HTTP config');
    log.verbose('Clearing previous HTTP config values');
    _.each(_config, function (value, key) {
      http.set(key, undefined);
    });
    _config = {};
    log.verbose('Setting new HTTP config values');
    _.each(config.http, function (value, key) {
      http.set(key, value);
      _config[key] = value;
    });
  }
};
var express = require('express');

module.exports = function (config, middleware, router, log) {

  log = log.namespace('static');

  function Static () {
    this.middleware = null;

    var self = this;

    config.watch('paths', function (key, previous, current) {
      if ((previous && previous['static']) !== (current && current['static'])) {
        log.verbose('Static paths changed');
        self.reload();
      }
    });

    config.watch('static', function (key, previous, current) {
      log.verbose('Static config changed');
      self.reload();
    });

    this.reload();
  }

  Static.prototype._middleware = function() {
    return express['static'](config.paths['static'], config['static'] || {});
  };

  Static.prototype.reload = function() {
    log.verbose('Reloading');

    if (!config.paths['static'] || config['static'] === false) {
      if (!this.middleware) return;
      log.verbose('Removing middleware');
      middleware.remove(this.middleware);
      this.middleware = null;
      return;
    }

    var replace = this.middleware;
    this.middleware = this._middleware();
    if (!replace) {
      log.verbose('Inserting middleware');
      middleware.insertAfter(router.middleware, this.middleware);
    } else {
      log.verbose('Replacing middleware');
      middleware.replace(replace, this.middleware);
    }
  };

  return new Static();
};
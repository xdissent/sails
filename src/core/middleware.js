var _ = require('lodash');

module.exports = function (http, log) {

  log = log.namespace('middleware');

  function Middleware () {
  }

  Middleware.prototype.use = function(route, fn, index) {
    log.verbose('Using middleware', fn, 'for route', route, 'at index', index);
    if (_.isFunction(route)) {
      index = fn;
      fn = route;
      route = null;
    }
    route = route || '/';
    if (_.isUndefined(index) || _.isNull(index)) index = http.stack.length;

    if (!_.isString(route)) throw new Error('Invalid middleware route');
    if (!_.isFunction(fn)) throw new Error('Invalid middleware');
    if (!_.isNumber(index) || index > http.stack.length || index < -1) {
      throw new Error('Invalid middleware index');
    }

    // Save the function name and add it to the http middleware temporarily.
    var name = fn.name;
    http.use(route, fn);

    // Pull the middleware from the stack, store original and restore name.
    var mw = http.stack.pop();
    mw.handle.__middleware = fn;
    mw.handle.name = name;

    // Add the middleware back to the stack.
    http.stack.splice(index, 0, mw);
  };

  Middleware.prototype.append = function (route, fn) {
    if (!_.isFunction(fn)) fn = route, route = null;
    this.use(route, fn);
  };

  Middleware.prototype.prepend = function (route, fn) {
    if (!_.isFunction(fn)) fn = route, route = null;
    this.use(route, fn, this.indexOf('expressInit') + 1);
  };

  Middleware.prototype.insertBefore = function (before, route, fn) {
    if (!_.isFunction(fn)) fn = route, route = null;
    this.use(route, fn, this.indexOf(before));
  };

  Middleware.prototype.insertAfter = function (after, route, fn) {
    if (!_.isFunction(fn)) fn = route, route = null;
    this.use(route, fn, this.indexOf(after) + 1);
  };

  Middleware.prototype.indexOf = function(find) {
    return _.findIndex(http.stack, function (mw) {
      return mw.handle.name === find || mw.handle.__middleware === find || mw.handle === find;
    });
  };

  Middleware.prototype.clear = function() {
    http.stack.length = 0;
  };

  return new Middleware();
};
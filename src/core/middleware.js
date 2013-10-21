var _ = require('lodash');

module.exports = function (http, log) {

  log = log.namespace('middleware');

  function Middleware () {
  }

  Middleware.prototype.use = function(route, fn, index, replace) {
    if (_.isFunction(route)) {
      replace = index;
      index = fn;
      fn = route;
      route = null;
    }
    route = route || '/';
    if (_.isUndefined(index) || _.isNull(index)) index = http.stack.length;

    if (!_.isString(route)) throw new Error('Invalid middleware route');
    if (!_.isFunction(fn)) throw new Error('Invalid middleware');
    if (!_.isNumber(index) || index > http.stack.length || index < -http.stack.length) {
      throw new Error('Invalid middleware index');
    }

    if (_.isUndefined(replace) || _.isNull(replace)) replace = 0;
    if (!_.isNumber(replace) || replace > (index < 0 ? 0 - index : http.stack.length - index) || replace < 0) {
      throw new Error('Invalid replacements');
    }

    // Save the function name and add it to the http middleware temporarily.
    var name = fn.name;
    http.use(route, fn);

    // Pull the middleware from the stack, store original and restore name.
    var mw = http.stack.pop();
    mw.handle.__middleware = fn;
    mw.handle.name = name;

    // Add the middleware back to the stack.
    http.stack.splice(index, replace, mw);

    log.verbose('Using middleware', name, 'for route', route, 'at index', index);
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
    var index = this.indexOf(before);
    if (index < 0) throw new Error('Could not find before middleware');
    this.use(route, fn, index);
  };

  Middleware.prototype.insertAfter = function (after, route, fn) {
    if (!_.isFunction(fn)) fn = route, route = null;
    var index = this.indexOf(after);
    if (index < 0) throw new Error('Could not find after middleware');
    this.use(route, fn, index + 1);
  };

  Middleware.prototype.replace = function (replace, route, fn) {
    if (!_.isFunction(fn)) fn = route, route = null;
    var index = this.indexOf(replace);
    if (index < 0) throw new Error('Could not find replace middleware');
    this.use(route, fn, index, 1);
  };

  Middleware.prototype.remove = function (remove) {
    var index = this.indexOf(remove);
    if (index < 0) throw new Error('Could not find remove middleware');
    var removed = http.stack.splice(index, 1);
    if (!removed || !removed.length || removed.length < 1) {
      throw new Error('Could not remove middleware');
    }
    return removed[0].handle;
  };

  Middleware.prototype.indexOf = function(find) {
    if (_.isUndefined(find) || _.isNull(find)) return -1;
    return _.findIndex(http.stack, function (mw) {
      return mw.handle.name === find || mw.handle.__middleware === find || mw.handle === find;
    });
  };

  Middleware.prototype.clear = function() {
    http.stack.length = 0;
  };

  return new Middleware();
};
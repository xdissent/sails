var _ = require('lodash');

module.exports = function (http) {

  function Middleware () {
    this._middleware = [];
  };

  Middleware.prototype.append = Middleware.prototype.use = function (mw, name) {
    mw.name = name;
    this._middleware.push(mw);
  };

  Middleware.prototype.prepend = function (mw, name) {
    mw.name = name;
    this._middleware.unshift(mw);
  };

  Middleware.prototype.indexOf = function(nameOrMw) {
    if (_.isString(nameOrMw)) {
      return _.findIndex(this._middleware, function (mw) {
        return mw.name === nameOrMw;
      });
    }
    return this._middleware.indexOf(nameOrMw);
  };

  Middleware.prototype.insert_before = function (before, mw, name) {
    var index = this.indexOf(before);
    if (index < 0) {
      throw new Error('Invalid middlware');
    }
    mw.name = name;
    this._middleware.splice(index, 0, mw);
  };

  Middleware.prototype.insert_after = function (after, mw, name) {
    var index = this.indexOf(after);
    if (index < 0) {
      throw new Error('Invalid middlware');
    }
    mw.name = name;
    this._middleware.splice(index + 1, 0, mw);
  };

  Middleware.prototype.build = function () {
    this._middleware.forEach(function (mw) {
      http.use(mw);
    });
  };

  return new Middleware;
}
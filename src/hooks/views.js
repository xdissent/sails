var _ = require('lodash'),
  path = require('path');
  util = require('util'),
  glob = require('glob'),
  ExpressView = require('express/lib/view'),
  utils = require('express/lib/utils'),
  basename = path.basename,
  dirname = path.dirname,
  join = path.join,
  globPath = function (path) {
    return glob.sync(path, {nocase: true});
  },
  exists = function (path) {
    return globPath(path).length > 0;
  };

  function View(name, options) {
    ExpressView.call(this, name, options);
  }

  util.inherits(View, ExpressView);

  View.prototype.lookup = function(path) {
    var ext = this.ext;

    // <path>.<engine>
    if (!utils.isAbsolute(path)) path = join(this.root, path);
    if (exists(path)) return globPath(path)[0];

    // <path>/index.<engine>
    path = join(dirname(path), basename(path, ext), 'index' + ext);
    if (exists(path)) return globPath(path)[0];
  };

module.exports = function (http, config, moduleLoader, router, middleware, watcher, log) {

  log = log.namespace('views');

  function Views() {
    this._watcher = null;
    this._views = {};

    http.set('view', View);
    router.use(this._filter());
    middleware.insertBefore(router.middleware, view);

    var self = this;
    config.watch('paths', function (key, previous, current) {
      if ((previous && previous.views) !== (current && current.views)) {
        log.verbose('View paths changed');
        self.reload();
      }
    });

    config.watch('views', function (key, previous, current) {
      if ((previous && previous.engine) !== (current && current.engine)) {
        log.verbose('View engine changed');
        self._configure();
      }
    });

    this.reload();
    this._configure();
  }

  Views.prototype._filter = function() {
    var self = this;
    return function views (routes) {
      return _(routes).map(self._routeFilter, self).flatten().compact().value();
    };
  };

  Views.prototype._routeFilter = function(route) {
    if (!route || !route.target) return route;
    route.target = this._targetFilter(route.target);
    return route;
  };

  Views.prototype._targetFilter = function(target) {
    if (_.isArray(target)) {
      return _.map(target, this._targetFilter, this);
    }

    if (_.isString(target)) {
      var parsed = target.match(/^([^\/]+)\/?([^\/]*)?$/);
      if (!parsed) return target;
      var subview = _.isEmpty(parsed[2]) ? 'index' : parsed[2];
      target = {};
      target.view = join(parsed[1], subview);
    }

    if (!_.isPlainObject(target)) return target;

    if (!this._exists(target.view)) return target;

    return this._serve(target.view);
  };

  Views.prototype.reload = function() {
    log.verbose('Loading views from', config.paths.views);

    http.set('views', config.paths.views);

    var self = this;
    moduleLoader.optional({
      dirname: config.paths.views,
      filter: /(.+)\..+$/,
      replaceExpr: null,
      dontLoad: true,
      force: true
    }, function (err, modules) {
      if (err) throw err;

      var current = _.keys(modules),
        previous = _.keys(this._views),
        removed = _.difference(previous, current);

      _.extend(self._views, modules);
      _.extend(self, modules);
      _.each(removed, function (key) {
        delete self._views[key];
        delete self[key];
      });
    });
    log.verbose('Loaded views', this._views);
    router.reload();
    this._watch();
  };

  Views.prototype._configure = function() {
    http.set('view engine', config.views.engine);

    if (config.views.engine === 'ejs') {
      http.engine('ejs', require('ejs-locals'));
    }
  };

  Views.prototype._watch = function() {
    if (this._watcher) this._watcher.close();
    log.verbose('Watching', config.paths.views, 'for changes');
    var self = this;
    this._watcher = watcher(config.paths.views, function () {
      log.verbose('Views files changed');
      self.reload();
    });
  };

  Views.prototype._exists = function (name) {
    var pieces = name.split('/'),
      view = pieces[0],
      subview = pieces[1];
    if (!view) return false;
    if (!subview || !_.isPlainObject(this._views[view])) return !!this._views[view];
    return !!this._views[view][subview];
  };

  Views.prototype._serve = function (name) {
    var self = this;
    var fn = function view (req, res, next) {
      req.target = {view: name};
      res.view();
    };
    fn.toString = function () {
      return '[View: ' + name + ']';
    };
    fn.view = name;
    return fn;
  };

  return new Views();

  var views = loadViews();
  configure();
  router.insertFilterBefore('default', viewRoutesFilter());
  middleware.insertBefore(router.middleware, view);
  middleware.insertAfter(router.middleware, serveView);
  return views;

  function configure () {
    http.set('view', View);
    http.set('views', config.paths.views);
    http.set('view engine', config.views.engine);

    if (config.views.engine === 'ejs') {
      http.engine('ejs', require('ejs-locals'));
    }
  }

  function loadViews () {
    var views = {};
    moduleLoader.optional({
      dirname: config.paths.views,
      filter: /(.+)\..+$/,
      replaceExpr: null,
      dontLoad: true
    }, function (err, modules) {
      if (err) throw err;
      views = modules;
    });
    return views;
  }

  function viewRoutesFilter () {
    return function views (routes) {
      return _(routes).map(routeFilter).flatten().compact().value();
    };
  }

  function routeFilter (route) {
    if (!route || !route.target) return route;
    var parsed, subview;
    if (_.isString(route.target)) {
      parsed = route.target.match(/^([^\/]+)\/?([^\/]*)?$/);
      if (!parsed) return route;
      subview = _.isEmpty(parsed[2]) ? 'index' : parsed[2];
      route.target = {view: path.join(parsed[1], subview)};
    } else if (route.target.view) {
      parsed = route.target.view.split('/');
      subview = _.isEmpty(parsed[1]) ? 'index' : parsed[1];
      route.target.view = path.join(parsed[0], subview);
    }
    return route;
  }

  function serveView (req, res, next) {
    if (!req.target || !_.isString(req.target.view)) return next();
    var pieces = req.target.view.split('/'),
      view = pieces[0],
      subview = pieces[1];
    if (!view || !subview || !views[view] || !views[view][subview]) return next();
    res.view();
  }

  function view (req, res, next) {
    res.view = function (view, data, callback) {
      var args = _.clone(arguments);

      req.target = req.target || {};
      view = _.find(args, _.isString) || req.target.view;
      data = _.find(args, _.isPlainObject) || {};
      callback = _.find(args, _.isFunction) || null;

      var subview = null;
      if (view) {
        subview = view.split('/')[1] || 'index';
        view = view.split('/')[0];
      } else if (req.target.controller && req.target.action) {
        view = req.target.controller;
        subview = req.target.action;
      }

      if (!view) {
        var err = new Error('Cannot determine path to view');
        if (_.isFunction(callback)) return callback(err);
        throw err;
      }

      if (subview) {
        view = view + '/' + subview;
      }

      var layout = data.layout;

      if (layout !== false && _.isEmpty(layout)) {
        layout = config.views.layout;
      }

      if (config.views.engine !== 'ejs') {
        layout = false;
      }

      if (layout) {
        if (layout === true) {
          layout = config.paths.layout;
        }
        var absLayoutPath = path.resolve(config.paths.views, layout),
          absViewPath = path.join(config.paths.views, view),
          relLayoutPath = path.relative(path.dirname(absViewPath), absLayoutPath);
        res.locals._layoutFile = relLayoutPath;
      }

      _.extend(res.locals, {title: config.appName}, data);

      return res.render(view, data, callback);
    };

    next();
  }
};
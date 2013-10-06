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

module.exports = function (http, config, moduleLoader, routes, middleware) {

  var views = loadViews();
  configure();
  routes.appendHandler(routeHandler);
  middleware.insert_before(routes.middleware, view);
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

  function routeHandler (route) {
    if (!route.target || !(_.isString(route.target) || route.target.view)) {
      return;
    }

    var view = null, subview = null;
    if (_.isString(route.target)) {
      var parsed = route.target.match(/^([^\/]+)\/?([^\/]*)?$/);
      if (!parsed) return;
      view = parsed[1];
      subview = parsed[2];
    } else if (route.target.view) {
      // Get view and subview from route
      view = route.target.view.split('/')[0];
      subview = route.target.view.split('/')[1];
    } else if (route.target.controller) {
      return;
    }

    if (_.isEmpty(view)) return;
    view = view.toLowerCase();
    subview = (subview || 'index').toLowerCase();
    return {path: route.path, target: serveView(view, subview), verb: route.verb};
  }

  function serveView (view, subview) {
    var fullView = view + (subview ? '/' + subview : '');
    return function (req, res, next) {
      req.target = req.target || {};
      req.target.view = fullView;

      var viewMiddleware = views[view];
      if (!viewMiddleware || subview && !viewMiddleware[subview]) return next();
      res.view();
    };
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

      res.locals(data);

      return res.render(view, data, callback);
    };

    next();
  }
};
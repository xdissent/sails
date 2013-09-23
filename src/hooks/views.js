var _ = require('lodash'),
  path = require('path');

module.exports = function (http, config, moduleLoader, routes, middleware) {

  var views = loadViews();
  configure();
  routes.use(routeHandler);
  middleware.use(resView);
  return views;

  function configure () {
    http.set('view', View);
    http.set('views', config.paths.views);
    http.set('view engine', config.views.engine.ext);

    if (config.views.engine.ext === 'ejs') {
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
    }, function (err, _views) {
      if (err) throw err;
      views = _views;
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

    subview = (subview || 'index').toLowerCase();

    // Look up appropriate view and make sure it exists
    var viewMiddleware = views[view];

    // Dereference subview if the top-level view middleware is actually an object
    if (_.isPlainObject(viewMiddleware)) {
      viewMiddleware = viewMiddleware[subview];
    }

    // Bail if there's no corresponding middleware
    if (!viewMiddleware) return;

    return {path: route.path, target: serveView(view, subview), verb: route.verb};
  }

  function serveView (view, subview) {
    view = view + (subview ? '/' + subview : '');
    return function (req, res, next) {
      req.target = req.target || {};
      req.target.view = view;
      res.view();
    };
  };

  function resView (req, res, next) {
    res.view = function (viewPath, data, cb) {

      req.target = req.target || {};

      viewPath = _.find(arguments, _.isString) || req.target.view;
      data = _.find(arguments, _.isPlainObject) || {};
      cb = _.find(arguments, _.isFunction) || function () {};

      if (!viewPath && req.target.controller && req.target.action) {
        viewPath = req.target.controller + '/' + req.target.action;
      }

      viewPath = viewPath.replace(/\/+$/, '');

      var layout = data.layout;

      if (_.isEmpty(layout) || layout === true) {
        layout = config.views.layout;
      }

      if (config.views.engine.ext !== 'ejs') {
        layout = false;
      }

      if (layout) {
        var absLayoutPath = path.join(config.paths.views, layout),
          absViewPath = path.join(config.paths.views, viewPath),
          relLayoutPath = path.relative(path.dirname(absViewPath), absLayoutPath);
        res.locals._layoutFile = relLayoutPath;
      }

      return res.render(viewPath, data, function (err, rendered) {
        if (err) return res.serverError(err);
        cb();
        _.extend(res.locals, data);
        res.send(rendered);
      });
      
    };

    next();
  }
};
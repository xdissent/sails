var _ = require('lodash');

module.exports = function (config, middleware, router, log) {

  log = log.namespace('error');

  middleware.insertBefore(router.middleware, errors);
  middleware.append(error);
  return error;

  function error (err, req, res, next) {
    log.verbose('Handling error');
    res.error(err);
  }

  function errors (req, res, next) {
    log.verbose('Adding response helpers');

    res.error = res.error || function () {

      var args = _.map(arguments),
        err = _.find(args, function (arg) {
          return arg instanceof Error;
        });

      err = err || new Error();
      var status = _.find(args, _.isNumber) || err.status || 500,
        message = _.find(args, _.isString) || err.message || 'Internal Server Error';

      err.status = err.status || status;
      err.message = err.message || message;

      var data = {error: err, status: status, message: message};

      custom(function () {
        res.status(status);
        json(function () {
          view(function () {
            render(function () {
              log.verbose('Sending plain response');
              res.send(message);
            });
          });
        });
      });

      function custom (next) {
        if (!config.error || !_.isFunction(config.error.handler)) {
          log.verbose('No custome error handler - skipping custom');
          return next();
        }
        config.error.handler(err, req, res, next);
      }

      function json (next) {
        if (_.isUndefined(req.wantsJson)) {
          log.verbose('Qualifiers hook not loaded - skipping JSON');
          return next();
        }
        if (!req.wantsJson) {
          log.verbose('Request does not want JSON - skipping JSON');
          return next();
        }
        res.json(data);
      }

      function view (next) {
        if (!_.isFunction(res.view)) {
          log.verbose('Views hook not loaded - skipping view');
          return next();
        }
        res.view(status.toString(), data, function (err, rendered) {
          if (err) {
            log.verbose('Views rendering error - skipping view');
            return next();
          }
          res.send(rendered);
        });
      }

      function render (next) {
        try {
          res.render(status.toString(), data, function (err, rendered) {
            if (err) {
              log.verbose('Express rendering error - skipping render');
              return next();
            }
            res.send(rendered);
          });
        } catch (err) {
          log.verbose('Express rendering exception - skipping render');
          next();
        }
      }
    };

    res.serverError = res.serverError || helper('serverError', 500, 'Internal Server Error');
    res.forbidden = res.forbidden || helper('forbidden', 403, 'Forbidden');
    res.badRequest = res.badRequest || helper('badRequest', 400, 'Bad Request');

    function helper (name, status, message) {
      return function () {
        var args = _.map(arguments);
        if (!_.find(args, _.isString)) args.unshift(message);
        if (!_.find(args, _.isNumber)) args.unshift(status);
        res.error.apply(res, args);
      };
    }

    next();
  }
};
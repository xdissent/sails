var connectFlash = require('connect-flash');

module.exports = function (config, middleware, session) {
  middleware.insertAfter(session.middleware, flash);
  return flash;

  function flash (req, res, next) {
    if (!config.flash) return next();
    return connectFlash(config.flash)(req, res, next);
  }
};
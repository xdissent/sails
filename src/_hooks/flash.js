var connectFlash = require('connect-flash');

module.exports = function (config, middleware, session) {
  middleware.insert_after(session, flash);
  return flash;

  function flash (req, res, next) {
    return connectFlash(config.flash)(req, res, next);
  }
};
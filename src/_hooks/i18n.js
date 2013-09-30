var _i18n = require('i18n');

module.exports = function (config, middleware, cookies) {
  _i18n.configure({
    locales: config.i18n.locales,
    directory: config.paths.locales,
    defaultLocale: config.i18n.defaultLocale,
    updateFiles: config.i18n.updateFiles,
    extension: config.i18n.extension
  });
  middleware.insert_after(cookies, i18n);
  return i18n;

  function i18n (req, res, next) {
    _i18n.init(req, res, function () {
      res.locals.i18n = res.i18n = res.__;
      next();
    });
  }
};
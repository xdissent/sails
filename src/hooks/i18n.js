var _i18n = require('i18n');

module.exports = function (config, middleware, router) {
  configureI18n();
  config.watch(['paths', 'i18n'], configureI18n);
  middleware.insertBefore(router.middleware, i18n);
  return i18n;

  function configureI18n () {
    _i18n.configure({
      locales: config.i18n.locales,
      directory: config.paths.locales,
      defaultLocale: config.i18n.defaultLocale,
      updateFiles: config.i18n.updateFiles,
      extension: config.i18n.extension,
      cookie: config.i18n.cookie
    });
  }

  function i18n (req, res, next) {
    if (!config.i18n) return next();
    _i18n.init(req, res, function () {
      res.locals.i18n = res.i18n = res.__;
      next();
    });
  }
};
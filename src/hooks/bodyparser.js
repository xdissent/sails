module.exports = function (config, middleware, http) {
  middleware.prepend(bodyParser);
  return bodyParser;

  function bodyParser (req, res, next) {
    return next();
    if(req.bodyParserDisabled) {
      return next();
    }
    return http.bodyParser()(req, res, next);
  }
};
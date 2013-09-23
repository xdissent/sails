module.exports = function (config, middleware, http) {

  if (!config.bodyParser) {
    return false;
  }

  var bodyParser = function (req, res, next) {
    if(req.bodyParserDisabled) {
      return next();
    }
    return http.bodyParser()(req, res, next);
  };

  middleware.prepend(bodyParser);

  return bodyParser;
};
module.exports = function (middleware) {
  middleware.prepend(metadata);
  return metadata;

  function metadata (req, res, next) {
    req.baseUrl = req.protocol + '://' + req.host + ((req.port === 80 && req.protocol === 'http') || (req.port === 443 && req.protocol === 'https') ? '' : ':' + req.port);
    req.rawHost = req.host;
    req.rootUrl = req.baseUrl;
    req.baseurl = req.baseUrl;
    next();
  }
};
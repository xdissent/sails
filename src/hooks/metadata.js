module.exports = function (middleware) {
  middleware.prepend(metadata);
  return metadata;

  function metadata (req, res, next) {
    req.baseUrl = req.protocol + '://' + req.headers.host;
    req.rawHost = req.host;
    req.rootUrl = req.baseUrl;
    req.baseurl = req.baseUrl;
    next();
  }
};
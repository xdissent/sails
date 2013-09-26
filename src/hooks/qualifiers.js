module.exports = function (middleware, bodyParser) {
  middleware.insert_after(bodyParser, qualifiers);
  return qualifiers;

  function qualifiers (req, res, next) {
    if (req.protocol !== 'http' && req.protocol !== 'https') {
      return next();
    }
    
    req.explicitlyAcceptsHTML = !!req.accepts('html');
    
    req.wantsJson = req.xhr;
    req.wantsJson = req.wantsJson || !req.explicitlyAcceptsHTML;
    req.wantsJson = req.wantsJson || (req.is('json') && req.get('Accept'));

    req.wantsJSON = req.wantsJson;

    req.isAjax = req.xhr;
    req.isJson = req.is('json');
    req.acceptJson = !!req.accepts('json');
    req.isJsony = req.isJson || req.acceptJson;

    next();
  }
};
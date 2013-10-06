module.exports = function (middleware, bodyParser) {
  middleware.insertAfter(bodyParser, qualifiers);
  return qualifiers;

  function qualifiers (req, res, next) {
    if (req.protocol !== 'http' && req.protocol !== 'https') {
      return next();
    }
    
    req.explicitlyAcceptsHTML = !!req.accepts('html');
    
    req.wantsJson = req.xhr || !req.explicitlyAcceptsHTML || (req.is('json') && req.get('Accept'));
    req.wantsJSON = req.wantsJson;

    req.isAjax = req.xhr;
    req.isJson = req.is('json');
    req.acceptJson = !!req.accepts('json');
    req.isJsony = req.isJson || req.acceptJson;

    next();
  }
};
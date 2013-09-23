module.exports = function (middleware, routes) {

  var wildcard = function (err, req, res, next) {
    if (err) {
      console.log(err);
      // return sails.config[500](err, req, res);
    }
    res.send(404, 'Not Found');
    // sails.config[404](null, req, res);
  };

  middleware.insert_after(routes.middleware, wildcard);

  return wildcard;
};
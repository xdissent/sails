module.exports = function (middleware, routes) {
  middleware.insert_after(routes.middleware, notFound);
  return notFound;

  function notFound (req, res, next) {
    res.send(404, 'Not Found');
  }
};
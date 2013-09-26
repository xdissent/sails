module.exports = function (middleware, notFound) {
  middleware.insert_after(notFound, error);
  return error;

  function error (err, req, res, next) {
    console.error(err.stack);
    res.send(500, 'Error!!!!' + err.toString());
  }
};
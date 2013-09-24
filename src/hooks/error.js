module.exports = function (middleware, notfound) {
  middleware.insert_after(notfound, error);
  return error;

  function error (err, req, res, next) {
    console.error(err.stack);
    res.send(500, 'Error!!!!' + err.toString());
  }
};
module.exports = function (req, res, next) {
  res.custom = true;
  next();
};
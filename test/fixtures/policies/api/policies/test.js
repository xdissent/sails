module.exports = function (req, res, next) {
  if (res.custom) return res.send(200, 'CUSTOMTEST');
  res.send(200, 'TEST');
};
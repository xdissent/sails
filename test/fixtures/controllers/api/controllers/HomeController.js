module.exports = {
  index: function index (req, res, next) {
    res.send(200, 'OK');
  },
  array: [function action (req, res, next) {
    req.actioned = true;
    next();
  }, function check (req, res, next) {
    if (req.actioned) return res.send(200, 'OK');
    next(new Error('FAIL'));
  }]
};
module.exports = {
  bar: function bar (req, res, next) {
    res.send(200, 'BAR');
  },
  foo: function foo (req, res, next) {
    res.send(200, 'FOO');
  },
  fooray: [function fooOne (req, res, next) {
      req._foo = 123;
      next()
  }, function fooTwo (req, res, next) {
    if (req._foo === 123) return res.send(200, 'OK');
    next(new Error('FAIL'));
  }]
};
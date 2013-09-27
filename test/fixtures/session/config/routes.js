module.exports = {
  routes: {
    '/session/set': function (req, res, next) {
      req.session.test = 123;
      res.send(200, 'OK');
    },
    '/session/get': function (req, res, next) {
      if (req.session && req.session.test === 123) return res.send(200, 'OK');
      next(new Error('FAIL'));
    },
    '/session/unset': function (req, res, next) {
      delete req.session.test;
      res.send(200, 'OK');
    }
  }
};
module.exports = {
  routes: {
    '/view/routes/string/implicit': 'home',
    '/view/routes/string/explicit': 'home/index',
    '/view/routes/object/implicit': {view: 'home'},
    '/view/routes/object/explicit': {view: 'home/index'},
    '/view/routes/missing': 'missing/view',
    '/view/helper/defined': function (req, res, next) {
      if (typeof res.view === 'function') return res.send(200, 'OK');
      next(new Error('FAIL'));
    },
    '/view/helper/req/view': function (req, res, next) {
      req.target = {view: 'home'};
      res.view();
    },
    '/view/helper/req/view/subview': function (req, res, next) {
      req.target = {view: 'home/index'};
      res.view();
    },
    '/view/helper/args/view': function (req, res, next) {
      res.view('home');
    },
    '/view/helper/args/view/subview': function (req, res, next) {
      res.view('home/index');
    },
    '/view/helper/locals': function (req, res, next) {
      res.locals = {test: '123'};
      res.view('home/index');
    },
    '/view/helper/data': function (req, res, next) {
      res.view('home/index', {test: '123'});
    },
    '/view/helper/override': function (req, res, next) {
      res.locals = {test: '123'};
      res.view('home/index', {test: '456'});
    },
    '/view/helper/callback': function (req, res, next) {
      res.view('home/index', function (err, rendered) {
        if (!err) return res.send(200, 'OK');
        next(err)
      });
    },
    '/view/helper/callback/rendered': function (req, res, next) {
      res.view('home/index', function (err, rendered) {
        if (!err && /LAYOUT[\s\S]*HOME/.test(rendered)) return res.send(200, 'OK');
        next(err || new Error('FAIL'));
      });
    },
    '/view/helper/callback/error': function (req, res, next) {
      res.view('___FAIL___', function (err, rendered) {
        if (err) return res.send(200, 'OK');
        next(new Error('FAIL'));
      });
    },
    '/view/helper/order': function (req, res, next) {
      res.view({test: '123'}, 'home/index');
    },
    '/view/helper/layout/true': function (req, res, next) {
      res.view('home/index', {layout: true});
    },
    '/view/helper/layout/false': function (req, res, next) {
      res.view('home/index', {layout: false});
    },
    '/view/helper/layout/explicit': function (req, res, next) {
      res.view('home/index', {layout: 'other.ejs'});
    },
  }
};
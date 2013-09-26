module.exports = {
  routes: {
    '/controller/routes/object/implicit': {controller: 'home'},
    '/controller/routes/object/explicit': {controller: 'home', action: 'index'},
    '/controller/routes/string/implicit': 'home',
    '/controller/routes/string/explicit': 'home.index',
    '/controller/routes/string/long/implicit': 'HomeController',
    '/controller/routes/string/long/explicit': 'HomeController.index',
    '/controller/routes/missing/controller': 'missing.controller',
    '/controller/routes/missing/action': 'home.missing',
    '/controller/routes/array': [function (req, res, next) { next(); }, 'home.index'],
    '/controller/action/array': 'home.array'
  }
};
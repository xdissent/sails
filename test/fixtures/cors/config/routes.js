module.exports = {
  routes: {
    '/cors/true': {
      controller: 'home',
      action: 'index',
      cors: true
    },
    '/cors/false': {
      controller: 'home',
      action: 'index',
      cors: false
    }
  }
};
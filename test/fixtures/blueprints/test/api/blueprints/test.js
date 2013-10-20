module.exports = function () {
  return {
    routes: {
      '/test': 'test',
      '/index': 'index'
    },
    controller: {
      test: function (req, res, next) {
        res.send(200, 'TEST');
      },
      index: function (req, res, next) {
        res.send(200, 'INDEX');
      },
      optional: function (req, res, next) {
        res.send(200, 'OPTIONAL');
      }
    }
  }
};
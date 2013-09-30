module.exports = function () {
  return {
    test: {
      silent: false,
      subscribe: function () {
        console.log('SUBSCRIBING');
      }
    }
  };
};
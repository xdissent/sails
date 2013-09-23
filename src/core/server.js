module.exports = function (hooks, http, router, wildcard) {
  http.use(http.router);
  http.use(wildcard);
  return http.createServer();
};
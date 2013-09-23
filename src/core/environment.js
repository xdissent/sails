module.exports = function (overrides) {
  if (overrides.dev && overrides.prod) {
    throw new Error('You cannot specify both production AND development!');
  }
  var env = process.env['NODE_ENV'];
  if (overrides.prod) env = 'production';
  if (overrides.dev) env = 'development';
  if (overrides.env) env = overrides.env;
  if (overrides.environment) env = overrides.environment;
  return env || 'development';
};
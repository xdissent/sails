var Sails = require('../../src'),
  assert = require('assert'),
  sails = new Sails();

describe('route compiler', function () {
  var fn = function (req, res, next) {
    return next();
  };

  var routes = {
    '/string': 'string',

    '/object': {

      '/string': 'string',

      '/object': {
        controller: 'subObject',
        action: 'subAction'
      },

      'post /method': 'postAction',

      '/deep': {
        '/deeper': {
          '/deepest': 'deepest'
        }
      },

      'controller': 'object',
      'action': 'index',
      'method': 'get'
    },

    '/array': [
      'item0',
      {
        controller: 'array',
        action: 'item1'
      },
      fn,
      [
        'subItem0',
        {
          controller: 'array',
          action: 'subItem1'
        },
        fn
      ],
      {
        '/subArray': 'subArray'
      }
    ],

    '/function': fn
  };

  var expected = [
    {route: '/string', method: 'all', target: 'string'},
    {route: '/object', method: 'get', target: {controller: 'object', action: 'index'}},
    {route: '/object/string', method: 'all', target: 'string'},
    {route: '/object/object', method: 'all', target: {controller: 'subObject', action: 'subAction'}},
    {route: '/object/method', method: 'post', target: 'postAction'},
    {route: '/object/deep/deeper/deepest', method: 'all', target: 'deepest'},
    {route: '/array', method: 'all', target: 'item0'},
    {route: '/array', method: 'all', target: {controller: 'array', action: 'item1'}},
    {route: '/array', method: 'all', target: fn},
    {route: '/array', method: 'all', target: 'subItem0'},
    {route: '/array', method: 'all', target: {controller: 'array', action: 'subItem1'}},
    {route: '/array', method: 'all', target: fn},
    {route: '/array/subArray', method: 'all', target: 'subArray'},
    {route: '/function', method: 'all', target: fn}
  ];

  it('should compile routes', function () {
    // assert.equal(JSON.stringify(routeCompiler.compile(routes)), JSON.stringify(expected));
    assert.deepEqual(sails.routeCompiler.compile(routes), expected);
  });

});
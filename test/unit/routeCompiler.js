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

      controller: 'object',
      action: 'index',
      method: 'get'
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
        fn,
        {
          controller: 'array',
          action: 'getAction',
          method: 'get'
        }
      ],
      {
        '/subArray': 'subArray'
      }
    ],

    '/function': fn
  };

  var expected = [
    {path: '/string', method: 'all', target: 'string'},
    {path: '/object', method: 'get', target: {controller: 'object', action: 'index'}},
    {path: '/object/string', method: 'all', target: 'string'},
    {path: '/object/object', method: 'all', target: {controller: 'subObject', action: 'subAction'}},
    {path: '/object/method', method: 'post', target: 'postAction'},
    {path: '/object/deep/deeper/deepest', method: 'all', target: 'deepest'},
    {path: '/array', method: 'all', target: ['item0', {controller: 'array', action: 'item1'}, fn, 'subItem0', {controller: 'array', action: 'subItem1'}, fn]},
    {path: '/array', method: 'get', target: {controller: 'array', action: 'getAction'}},
    // {path: '/array', method: 'all', target: 'item0'},
    // {path: '/array', method: 'all', target: {controller: 'array', action: 'item1'}},
    // {path: '/array', method: 'all', target: fn},
    // {path: '/array', method: 'all', target: 'subItem0'},
    // {path: '/array', method: 'all', target: {controller: 'array', action: 'subItem1'}},
    // {path: '/array', method: 'all', target: fn},
    {path: '/array/subArray', method: 'all', target: 'subArray'},
    {path: '/function', method: 'all', target: fn}
  ];

  it('should compile routes', function () {
    assert.equal(JSON.stringify(sails.routeCompiler.compile(routes)), JSON.stringify(expected));
    assert.deepEqual(sails.routeCompiler.compile(routes), expected);
  });

});
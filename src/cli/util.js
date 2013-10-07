var _ = require('lodash');

var util = module.exports = {
  longest: function longest (rows) {
    return _.reduce(rows, function (lengths, row) {
      _.each(row, function (col, num) {
        lengths[num] = Math.max(col.toString().length, lengths[num] || 0);
      });
      return lengths;
    }, Array(rows.length));
  },

  pad: function pad (str, width) {
    var len = Math.max(0, width - str.toString().length);
    return str.toString() + Array(len + 1).join(' ');
  },

  columnize: function columnize (headers, rows) {
    if (!rows) {
      rows = headers;
      headers = null;
    }
    if (headers) {
      rows = [headers, _.map(headers, function (header) {
        return (new Array(header.length + 1)).join('-');
      })].concat(rows);
    }
    var pads = util.longest(rows);
    return _.map(rows, function (row) {
      return _.map(row, function (col, num) {
        return util.pad(col, pads[num]);
      }).join('\t');
    }).join('\n');
  }
};
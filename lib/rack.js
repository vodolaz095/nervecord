'use strict';

var
  crypto = require('crypto');

module.exports = exports = function () {
  return crypto.randomBytes(9).toString('hex');
};



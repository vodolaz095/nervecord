'use strict';

var
  redis = require('redis');

module.exports = exports = function (port, host, auth) {
  return redis.createClient(port, host, {'auth_pass': auth});
};

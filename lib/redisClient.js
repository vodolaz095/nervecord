var redis = require('redis');

module.exports = exports = function (port,host,auth){
  var client = redis.createClient(port, host);
  if (auth) {
    client.auth(auth, function (err) {
      if (err) {
        throw err;
      }
    });
  }
  return client;
};

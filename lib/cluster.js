var master = require('./master.js'),
  worker = require('./worker.js'),
  url = require('url');

function NerveCord(options){

if (options) {
    if (typeof options === 'object') {
      if (options.port && !(/^[0-9]+$/.test(options.port))) {
        throw new Error('Config variable of redis has bad value for PORT. Proper values are ' +
          '{"port":6379,"host":"localhost","auth":"someSecretPassword"} ' +
          'or "redis://usernameIgnored:someSecretPassword@redis.example.org:6739"');
      }
    } else {
      if (typeof options === 'string') {
        var optionsUrlParsed = url.parse(options);
        if (optionsUrlParsed) {
          options = {
            'port':optionsUrlParsed.port,
            'host':optionsUrlParsed.hostname, 
          };
          
          if (optionsUrlParsed.auth && optionsUrlParsed.auth.split(':')[1]) {
            options.prefix=optionsUrlParsed.auth.split(':')[0];
            options.auth=optionsUrlParsed.auth.split(':')[1];
          }
        } else {
          throw new Error('Config variable of redis has bad value. Proper values are ' +
            '{"port":6379,"host":"localhost","auth":"someSecretPassword"} ' +
            'or "redis://usernameIgnored:someSecretPassword@redis.example.org:6739"');
        }
      } else {
        throw new Error('Config variable of redis has bad value. Proper values are ' +
          '{"port":6379,"host":"localhost","auth":"someSecretPassword"} ' +
          'or "redis://usernameIgnored:someSecretPassword@redis.example.org:6739"');
      }
    }
  }

  this.options=options;
  return this;
};

NerveCord.prototype.createMaster = function(){
  return new master(this.options);
};
NerveCord.prototype.createWorker = function(channelName,action){
  return new worker(channelName,action,this.options);
};

module.exports = exports = NerveCord;

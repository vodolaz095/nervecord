var master = require('./master.js'),
  worker = require('./worker.js');

function NerveCord(options){
  this.options=options;
}


NerveCord.prototype.createMaster = function(){
  return new master(this.options);
};
NerveCord.prototype.createWorker = function(channelName,action){
  return new worker(channelName,action,this.options);
};

module.exports = exports = NerveCord;
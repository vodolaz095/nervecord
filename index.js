var redis = require('redis'),
	hat = require('hat'),
	rack = hat.rack(),
	async = require('async'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter;

/**
 * Creates ganglia example
 * $object Options
 * options.port - redis port, default 6379;
 * options.host - redis host, default localhost;
 * options.auth - redis auth password;
 * options.defaultChannel - default channel for spine to emit events to
 * options.prefix - prefix for spine channel
 */
function Ganglia(options){
    EventEmitter.call(this);
    if(!options) options={};
    var port = (options.port)?(options.port):6379;
    var host = (options.host)?(options.host):'localhost'; 
	this.prefix = (options.prefix)?(options.prefix):'spine_'; 
	//we need 3 redis clients, because when redis client is in pub_sub mode
	//it cannot access database
    this.redisEmitter=redis.createClient(port,host);
    if(options.auth){
		this.redisEmitter.auth(options.auth,function(err){
			if(err) throw err;
		});
	}
    this.redisClient=redis.createClient(port,host);
    if(options.auth){
		this.redisClient.auth(options.auth,function(err){
			if(err) throw err;
		});
	}
    this.redisListener=redis.createClient(port,host);
    if(options.auth){
		this.redisClient.auth(options.auth,function(err){
			if(err) throw err;
		});
	}
	var thisG=this;
	this.redisListener.on('pmessage',function(pattern,channel,message){
		thisG.emit(message.split(':')[0],message.split(':')[1]);
	});
	this.redisListener.psubscribe(this.prefix+'*');
	return this;
}

util.inherits(Ganglia, EventEmitter);

Ganglia.prototype.getTask = function(taskId,callback){
	this.redisClient.hgetall(''+this.prefix+'_job_'+taskId,callback);
}

Ganglia.prototype.createTask=function(channelName,payload,delayInMS,callback){
	if(/[a-zA-Z0-9_]+/.test(channelName)){
	if(typeof delayInMS == 'function'){
		callback=delayInMS;
		delayInMS=0;
	} else {
		delayInMS=parseInt(delayInMS);
		if(delayInMS>=0){
			//ok
		} else {
			callback(new Error('Delay is lesser than zero!'));
			return;
		}
	}
	var newTaskId = rack(),
		thisG=this,
		now=0+new Date().getTime()+delayInMS;
	async.parallel({
		'addTaskIdToChannel':function(cb){
			thisG.redisClient.zadd(
				''+thisG.prefix+'_channel_pending_'+channelName,
				now,
				newTaskId,
				cb);
		},
		'addTaskForLogging':function(cb){
			thisG.redisClient.zadd(
				''+thisG.prefix+'_channel_log_'+channelName,
				now,
				newTaskId,
				cb);
		},
		'savePayload':function(cb){
			thisG.redisClient.hset(
				''+thisG.prefix+'_job_'+newTaskId,
				'payload',
				JSON.stringify(payload),
				cb);
		},
	},function(err,obj){
		if(err){
			callback(err);
		} else {
			thisG.redisEmitter.publish(''+thisG.prefix+channelName, 'new_task:'+newTaskId);
			callback(null,newTaskId);
		}
	});
	} else {
		callback(new Error('Wrong channel name '+channelName));
		return;
	};
}

Ganglia.prototype.createTaskAndWait=function(channelName,payload,delayInMS,callback){
	if(/[a-zA-Z0-9_]+/.test(channelName)){
	if(typeof delayInMS == 'function'){
		callback=delayInMS;
		delayInMS=0;
	} else {
		delayInMS=parseInt(delayInMS);
		if(delayInMS>=0){
			//ok
		} else {
			callback(new Error('Delay is lesser than zero!'));
			return;
		}
	}
	thisG=this;	
	thisG.createTask(channelName,payload,delayInMS,function(err,taskId){
		if(err){
			callback(err);
		} else {
			thisG.on('task_done',function(message){
			  if(message == taskId){
//				console.log('task_done'+taskId);
				thisG.getTask(taskId,callback);
				return;
			  }
			});
		}
	});
	} else {
		callback(new Error('Wrong channel name '+channelName));
		return;
	}
};

function Appendage(channelName,action,options){
	EventEmitter.call(this);
    if(!options) options={};
    var port = (options.port)?(options.port):6379;
    var host = (options.host)?(options.host):'localhost'; 
	this.prefix = (options.prefix)?(options.prefix):'spine_'; 
	//we need 3 redis clients, because when redis client is in pub_sub mode
	//it cannot access database
    this.redisEmitter=redis.createClient(port,host);
    if(options.auth){
		this.redisEmitter.auth(options.auth,function(err){
			if(err) throw err;
		});
	}
    this.redisClient=redis.createClient(port,host);
    if(options.auth){
		this.redisClient.auth(options.auth,function(err){
			if(err) throw err;
		});
	}
    this.redisListener=redis.createClient(port,host);
    if(options.auth){
		this.redisListener.auth(options.auth,function(err){
			if(err) throw err;
		});
	}
	thisA=this;
	
	this.redisListener.on('message',function(channel,message){
		var theme=message.split(':')[0];
		if(theme=='new_task'){
			var jobId=message.split(':')[1];
			thisA.getTask(jobId,function(err,task){
			  if(err) throw err;
			  action(jobId,task.payload,function(jobErr,result){
					async.parallel({
						'saveResultToJob':function(cb){
							thisA.redisClient.hset(
								''+thisG.prefix+'_job_'+jobId,
								'result',
								JSON.stringify(result),
							cb);
						},
						'saveErrorToJob':function(cb){
							if(jobErr){
								thisA.redisClient.hset(
									''+thisG.prefix+'_job_'+jobId,
									'error',
									jobErr.message,
								cb);
							} else {
								cb(null,true)	
							}
						},
						'clearJobFromChannel':function(cb){
							thisA.redisClient.zrem(
							''+thisG.prefix+'_channel_pending_'+channelName,
							jobId,
							cb)
						},
					},function(err,obj){
						thisA.redisEmitter.publish(''+thisA.prefix+channelName, 'task_done:'+jobId);
					});
				});
			});
		} else {
			return;
		}
	});
	
	this.redisListener.subscribe(''+this.prefix+channelName);
	return this;
}

util.inherits(Appendage, EventEmitter);

Appendage.prototype.getTask = function(taskId,callback){
	this.redisClient.hgetall(''+this.prefix+'_job_'+taskId,callback);
}

exports.createGanglia=function(options){
	return new Ganglia(options);
}
exports.createAppendage=function(channelName,options,action){
	return new Appendage(channelName,options,action);
}

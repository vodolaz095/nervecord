var redis = require('redis'),
  hat = require('hat'),
  rack = hat.rack(),
  async = require('async'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter;


/**
 * Creates Master
 * $object Options
 * options.port - redis port, default 6379;
 * options.host - redis host, default localhost;
 * options.auth - redis auth password;
 * options.prefix - prefix for spine channel
 */

function Master(options) {
  EventEmitter.call(this);
  if (!options) {
    options = {};
  }
  var port = (options.port) ? (options.port) : 6379;
  var host = (options.host) ? (options.host) : 'localhost';
  this.prefix = (options.prefix) ? (options.prefix) : 'nervecord';
  //we need 3 redis clients, because when redis client is in pub_sub mode
  //it cannot access database
  this.redisEmitter = redis.createClient(port, host);
  if (options.auth) {
    this.redisEmitter.auth(options.auth, function (err) {
      if (err) {
        throw err;
      }
    });
  }
  this.redisClient = redis.createClient(port, host);
  if (options.auth) {
    this.redisClient.auth(options.auth, function (err) {
      if (err) {
        throw err;
      }
    });
  }
  this.redisListener = redis.createClient(port, host);
  if (options.auth) {
    this.redisClient.auth(options.auth, function (err) {
      if (err) {
        throw err;
      }
    });
  }
  var thisG = this;
  this.redisListener.on('pmessage', function (pattern, channel, message) {
    thisG.emit(message.split(':')[0], message.split(':')[1]);
  });
  this.redisListener.psubscribe(this.prefix + '*');
  return this;
};

util.inherits(Master, EventEmitter);

Master.prototype.getTask = function (taskId, callback) {
  this.redisClient.hgetall('' + this.prefix + '_job_' + taskId, callback);
};

Master.prototype.createTask = function (channelName, payload, callback) {
  if (/[a-zA-Z0-9_]+/.test(channelName)) {
    var newTaskId = rack(),
      thisG = this,
      now = 0 + new Date().getTime();
    async.parallel({
      'addTaskIdToChannel': function (cb) {
        thisG.redisClient.lpush(
          '' + thisG.prefix + '_'  + channelName+'_tasks',
          newTaskId,
          cb);
      },
      'addTaskForLogging':function(cb){
        thisG.redisClient.zadd(
          ''+thisG.prefix+'_'+channelName+'_log',
          now,
          newTaskId,
          cb);
      },
      'saveJobParameters':function(cb){
        thisG.redisClient.hmset(
          '' + thisG.prefix + '_job_' + newTaskId,
          {
            'id':''+newTaskId,
            'channel':channelName,
            'startedAt':new Date().getTime(),
            'status':'new',
            'payload':JSON.stringify(payload)
          },
          cb
        );
      }
    }, function (err, obj) {
      if (err) {
        callback(err);
      } else {
        thisG.redisEmitter.publish('' + thisG.prefix + channelName, 'new_task:' + newTaskId);
        callback(null, newTaskId);
      }
    });
  } else {
    callback(new Error('Wrong channel name ' + channelName));
    return;
  }
};

Master.prototype.createTaskAndWait = function (channelName, payload, callback) {
  if (/[a-zA-Z0-9_]+/.test(channelName)) {
    thisG = this;
    thisG.createTask(channelName, payload, function (err, taskId) {
      if (err) {
        callback(err);
      } else {

        var listenerFunc = function (message) {
          if (message == taskId) {
//				console.log('task_done'+taskId);
            thisG.removeListener('task_done', listenerFunc);
            thisG.getTask(taskId, function(err,task){
              if(err){
                callback(err);
              } else {
                callback(null,task)
              }
            });
            return;
          }
        };

        thisG.on('task_done', listenerFunc);
      }
    });
  } else {
    callback(new Error('Wrong channel name ' + channelName));
    return;
  }
};


module.exports = exports = Master;
'use strict';

var
  rack = require('./rack.js'),
  util = require('util'),
  createRedisClient = require('./redisClient.js'),
  EventEmitter = require('events').EventEmitter;

function Worker(channelName, action, options) {
  if(typeof channelName !== 'string'){
    throw new Error('channelName is not a string!');
  }
  if(typeof action !== 'function'){
    throw new Error('action have to be a "function(payload,done)"!');
  }
  
  EventEmitter.call(this);
  if (!options) {
    options = {};
  }
  this.name = channelName + '_worker_' + rack();

  var port = (options.port) ? (options.port) : 6379;
  var host = (options.host) ? (options.host) : 'localhost';
  var auth = (options.auth) ? (options.auth) : null;
  this.prefix = (options.prefix) ? (options.prefix) : 'nervecord';
  //we need 3 redis clients, because when redis client is in pub_sub mode
  //it cannot access database

  this.redisEmitter = createRedisClient(port,host,auth);
  this.redisClient = createRedisClient(port,host,auth);
  this.redisListener = createRedisClient(port,host,auth);

  this.channelName = channelName;
  this.action = action;
  return this;
}

util.inherits(Worker, EventEmitter);


Worker.prototype.getTask = function (taskId, callback) {
  this.redisClient.hgetall('' + this.prefix + '_job_' + taskId, callback);
};

Worker.prototype.processTask = function (taskId, callback) {
  var
    thisW = this,
    payloadParsed;

  thisW.getTask(taskId, function (err, task) {
      if (err) {
        throw err;
      }
      if (task.status === 'new') {
        thisW.emit('start_job',taskId);
        payloadParsed=JSON.parse(task.payload);
        payloadParsed.id = taskId;
        thisW.action(payloadParsed, function (jobErr, result) {
          thisW.redisClient.hmset(
            '' + thisW.prefix + '_job_' + taskId,
            {
              'worker': thisW.name,
              'finishedAt': new Date().getTime(),
              'duration': (new Date().getTime()-task.startedAt),
              'status': 'processed',
              'result': JSON.stringify(result),
              'error': (jobErr) ? (jobErr.message) : null
            },
            function (err, obj) {
              if (err) {
                callback(err);
              } else {
                thisW.emit('complete_job',taskId);
                thisW.redisEmitter.publish('' + thisW.prefix + thisW.channelName, 'task_done:' + taskId);
                callback(null);
              }
            });
        });
      }
      else {
        callback(new Error('Task is processed'));
      }
    }
  );
};

Worker.prototype.start = function () {
  var thisW = this;

  this.redisListener.on('message', function (channel, message) {
    var theme = message.split(':')[0];
    if (theme == 'new_task') {
      var jobId = message.split(':')[1];
      thisW.processTask(jobId,function(err){});
    } else {
      return;
    }
  });
  this.redisListener.subscribe('' + this.prefix + this.channelName);

  setInterval(function () {
    thisW.redisClient.rpop('' + thisW.prefix + '_' + thisW.channelName + '_tasks', function (err, jobId) {
      if (err) {
        throw err;
      }
      if (jobId) {
        thisW.processTask(jobId,function(err){});
      } else {
        return;
      }
    });
  }, 500);

  return this;
};


module.exports = exports = Worker;

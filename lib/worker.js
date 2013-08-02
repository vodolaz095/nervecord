var redis = require('redis'),
  hat = require('hat'),
  rack = hat.rack(),
  async = require('async'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter;

function Worker(channelName, action, options) {
  EventEmitter.call(this);
  if (!options) {
    options = {};
  }
  this.name = channelName + '_worker_' + rack();
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
    this.redisListener.auth(options.auth, function (err) {
      if (err) {
        throw err;
      }
    });
  }

  this.channelName = channelName;
  this.action = action;
  return this;
}

util.inherits(Worker, EventEmitter);


Worker.prototype.getTask = function (taskId, callback) {
  this.redisClient.hgetall('' + this.prefix + '_job_' + taskId, callback);
};

Worker.prototype.processTask = function (taskId, callback) {
  var thisW = this;
  thisW.getTask(taskId, function (err, task) {
      if (err) {
        throw err;
      }
      if (task.status === 'new') {
        thisW.emit('start_job',taskId);
        thisW.action(JSON.parse(task.payload), function (jobErr, result) {
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
                thisW.redisEmitter.publish('' + thisW.prefix + this.channelName, 'task_done:' + taskId);
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
}

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
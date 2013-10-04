var should = require('should'),
  async = require('async'),
  NerveCord = require('./../index.js'),
  redisClientListener = require('redis').createClient(),
  redisClient = require('redis').createClient();

describe('NerveCord - master', function () {
  var nerve = new NerveCord(),
    messageSent = false,
    master = nerve.createMaster(),
    payload = {'a': 1, 'b': 'string', 'c': {a: 1, b: 2}, d: ["one", "two", "three"]},
    taskReturned,
    taskCreatedId;


  before(function (done) {
    redisClientListener.on('message', function (channel, message) {
      messageSent = message;
    });
    redisClientListener.subscribe('nervecordTest');
    setTimeout(done, 500);
  });

  describe('createTask', function () {
    before(function (done) {
      master.createTask('Test', payload, function (err, taskId) {
        if (err) {
          throw err;
        }
        taskCreatedId = taskId;
        done();
      });
    });

    it('returns the correct taskId', function () {
      taskCreatedId.should.be.a('string');
      taskCreatedId.length.should.be.above(16);
    });

    it('emits the event of "new_task:taskId"', function () {
      messageSent.should.be.equal('new_task:' + taskCreatedId);
    });

    describe('it correctly populates the redis db',function(){
      var data;
      before(function (done) {
      async.parallel(
        {
          'taskId_in_tasks':function(cb){
            redisClient.llen('nervecord_Test_tasks',cb);
          },
          'taskId_in_logs':function(cb){
            redisClient.zrangebyscore('nervecord_Test_log','-inf','+inf',cb);
          }
        },function(err,info){
          if(err) throw err;
          data=info;
          done();
        });
      });

      it('adds only one task to list of current tasks',function(){
        data.taskId_in_tasks.should.be.equal(1);
      });

      it('adds task to the log',function(){
        data.taskId_in_logs.should.be.eql([taskCreatedId]);
      });



    });
  });

  describe('getTask for taskId of created previously task', function () {
    before(function (done) {
      master.getTask(taskCreatedId, function (err, task) {
        if (err) {
          throw err;
        }
        taskReturned = task;
        done();
      })
    });

    it('returns the correct task', function () {
      taskReturned.should.be.a('object');
      var tenSecondsAgo = new Date().getTime() - 10000;
      taskReturned.startedAt.should.be.above(tenSecondsAgo);
      taskReturned.channel.should.be.equal('Test');
      taskReturned.status.should.be.equal('new');
      var payloadParsed = JSON.parse(taskReturned.payload);
      payloadParsed.should.eql(payload);
    });
  });

  describe('getTask for taskId of non existant task', function () {
    before(function (done) {
      master.getTask('taskDoNotExiststaskDoNotExiststaskDoNotExiststaskDoNotExists', function (err, task) {
        if (err) {
          throw err;
        }
        taskReturned = task;
        done();
      })
    });

    it('returns the null', function () {
      should.not.exist(taskReturned);
    });
  });

  after(function (done) {
    async.parallel({
        'delete job': function (cb) {
          redisClient.del('nervecord_job_' + taskCreatedId, cb);
        },
        'delete log': function (cb) {
          redisClient.del('nervecord_Test_log', cb);
        },
        'delete tasks': function (cb) {
          redisClient.del('nervecord_Test_tasks', cb);
        }},
      done);
  });

});

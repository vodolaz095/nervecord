var should = require('should'),
  async = require('async'),
  NerveCord = require('./../index.js');

describe('NerveCord - in action',function(){
  var cluster = new NerveCord();
  var master = cluster.createMaster();
  var workerSum = cluster.createWorker('sum', function (payload, done) {
    setTimeout(function () {
      done(null, (0 + payload.a + payload.b));
    }, (Math.random() * 200));

  });

  var startJobId,completeJobId,job;


  before(function(done){
    workerSum.on('start_job',function(jobId){
      startJobId=jobId;
    });

    workerSum.on('complete_job',function(jobId){
      completeJobId=jobId;
    });
    workerSum.start();

    master.createTaskAndWait('sum', {a: 2, b: 3}, function (err, jobDone) {
      if (err) {
        throw err;
      }
      job=jobDone;
      done();
    });

  });

  it('master issues message and waits for it completion',function(){
    var tenSecondsAgo = new Date().getTime() - 10000;
    job.channel.should.equal('sum');
    job.result.should.equal('5');
    job.payload.should.equal('{"a":2,"b":3}');
    job.status.should.equal('processed');
    job.finishedAt.should.be.above(job.startedAt);
    job.finishedAt.should.be.above(tenSecondsAgo);
    job.startedAt.should.be.above(tenSecondsAgo);
    job.worker.should.match(/^sum_worker_/);
  });

  it('worker emits event that he starts processing task issued',function(){
    startJobId.should.be.equal(job.id);
  });

  it('worker emits event that he complete processing task issued',function(){
    completeJobId.should.be.equal(job.id);
  });



});
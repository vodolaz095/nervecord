var NerveCord = require('./../index.js');

var cluster = new NerveCord({
  'host': 'localhost',
  'port': 6379,
  'prefix': 'nervecord'
});

////////////////

var workerSum = cluster.createWorker('sum', function (payload, done) {
  setTimeout(function () {
    done(null, (0 + payload.a + payload.b));
  }, (Math.random() * 1000));

});
workerSum.on('start_job',function(jobId){
  console.log('Worker_sum starts job '+jobId)
});

workerSum.on('complete_job',function(jobId){
  console.log('Worker_sum completes job '+jobId)
});
workerSum.start();

////////////////

var workerMul = cluster.createWorker('mul', function (payload, done) {
  setTimeout(function () {
    done(null, (0 + payload.a * payload.b));
  }, (Math.random() * 1000));
});
workerMul.on('start_job',function(jobId){
  console.log('Worker_mul starts job '+jobId)
});

workerMul.on('complete_job',function(jobId){
  console.log('Worker_mul completes job '+jobId)
});
workerMul.start();

////////////////

var master = cluster.createMaster();
setInterval(function () {

  master.createTaskAndWait('sum', {a: 2, b: 3}, function (err, jobDone) {
    if (err) {
      throw err;
    }
    console.log(jobDone);
  });

  master.createTaskAndWait('mul', {a: 2, b: 3}, function (err, jobDone) {
    if (err) {
      throw err;
    }
    console.log(jobDone);
  });
}, 1000);
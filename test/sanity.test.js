var should = require('should'),
  NerveCord = require('./../index.js');

describe('NerveCord - sanity',function(){
  var nerve=new NerveCord();

  it('has a function to spawn master',function(){
    nerve.createMaster.should.be.a('function');
  });

  it('has a function to spawn worker',function(){
    nerve.createWorker.should.be.a('function');
  });

  describe('master',function(){
    var master = nerve.createMaster();

    it('has a function getTask',function(){
      master.getTask.should.be.a('function');
    });

    it('has a function createTask',function(){
      master.createTask.should.be.a('function');
    });

    it('has a function createTaskAndWait',function(){
      master.createTaskAndWait.should.be.a('function');
    });

    it('has a function emit',function(){
      master.emit.should.be.a('function');
    });

    it('has a function on',function(){
      master.on.should.be.a('function');
    });
  });

  describe('worker',function(){
    var worker = nerve.createWorker('test', function(payload, done){
      done(null,payload);
    });

    it('has a function getTask',function(){
      worker.getTask.should.be.a('function');
    });

    it('has a function start',function(){
      worker.start.should.be.a('function');
    });

    it('has a function processTask',function(){
      worker.processTask.should.be.a('function');
    });

    it('has a function emit',function(){
      worker.emit.should.be.a('function');
    });

    it('has a function on',function(){
      worker.on.should.be.a('function');
    });

    it('has a function start',function(){
      worker.start.should.be.a('function');
    });
  });

  describe('new NerveCord(config) throws errors on bad config',function(){
    it('throws errors when config.port is not an integer',function(){
      (function () {
        var badNerve = new NerveCord({port:'not a port'});
      }).should.throw('Error in Nervecord config!');  
    });

    it('throws errors when config is not parseable redisUrl',function(){
      (function () {
        var badNerve = new NerveCord('I am pineapple!');
      }).should.throw('Error in Nervecord config!');  
    });
  });

});

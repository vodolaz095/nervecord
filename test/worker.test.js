var should = require('should'),
  async = require('async'),
  NerveCord = require('./../index.js'),
  redisClientListener = require('redis').createClient(),
  redisClient = require('redis').createClient();

describe('NerveCord - worker',function(){
  cluster=new NerveCord();
  it('have to throw errors for invalid channel name',function(){
   (function () {
     cluster.createWorker(null);
   }).should.throw('channelName is not a string!');
  });
  it('have to throw errors for invalid action function',function(){
   (function () {
     cluster.createWorker('someChannel');
   }).should.throw('action have to be a "function(payload,done)"!');
  });
  it('have to read corresponding list at least every second');
  it('have to listen to incoming message');
});

var should = require('should'),
  async = require('async'),
  NerveCord = require('./../index.js'),
  redisClientListener = require('redis').createClient(),
  redisClient = require('redis').createClient();

describe('NerveCord - worker',function(){

  it('have to throw errors for invalid channel name');
  it('have to throw errors for invalid action function');
  it('have to read corresponding list at least every second');
  it('have to listen to incoming message');
});
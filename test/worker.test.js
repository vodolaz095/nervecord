'use strict';

var
  should = require('should'),
  NerveCord = require('./../index.js');


describe('NerveCord - worker', function () {
  var cluster = new NerveCord();
  it('have to throw errors for invalid channel name', function () {
    (function () {
      cluster.createWorker(null);
    }).should.throw('channelName is not a string!');
  });
  it('have to throw errors for invalid action function', function () {
    (function () {
      cluster.createWorker('someChannel');
    }).should.throw('action have to be a "function(payload,done)"!');
  });
});

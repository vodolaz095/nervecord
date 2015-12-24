'use strict';

var
  Master = require('./master.js'),
  Worker = require('./worker.js'),
  url = require('url');

function NerveCord(options) {

  if (options) {
    if (typeof options === 'object') {
      if (options.port && !(/^[0-9]+$/.test(options.port))) {
        throw new Error('Error in Nervecord config!');
      }
    }

    if (typeof options === 'string') {
      var optionsUrlParsed = url.parse(options);
      if (optionsUrlParsed['protocol'] === 'redis:') {
        options = {
          'port': optionsUrlParsed.port,
          'host': optionsUrlParsed.hostname
        };

        if (optionsUrlParsed.auth && optionsUrlParsed.auth.split(':')[1]) {
          options.prefix = optionsUrlParsed.auth.split(':')[0];
          options.auth = optionsUrlParsed.auth.split(':')[1];
        }
      } else {
        throw new Error('Error in Nervecord config!');
      }
    }
  }

  this.options = options;

  this.createMaster = function () {
    return new Master(this.options);
  };

  this.createWorker = function (channelName, action) {
    return new Worker(channelName, action, this.options);
  };
  return this;
};

module.exports = exports = NerveCord;

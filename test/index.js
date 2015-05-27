/* global require, module, describe, it */

'use strict';

var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;

describe('promisify-event-emitter tests', function() {

  var promisifyEventEmitter = require('../index');

  it('should throw an error because params is missing an eventEmitter option', function() {
    var params = {
      listeners: [
        {
          name: 'data',
          on: function() {}
        }
      ]
    };
    expect(promisifyEventEmitter.bind(promisifyEventEmitter, params)).to.throw('params.eventEmitter is required');
  });

  it('should throw an error because an event listener is missing a name property', function() {
    var params = {
      eventEmitter: function() {
        return new EventEmitter();
      },
      listeners: [
        {
          on: function() {}
        }
      ]
    };
    expect(promisifyEventEmitter.bind(promisifyEventEmitter, params)).to.throw('listener option must have a name');
  });

});
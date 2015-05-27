/* global module, process, require */

'use strict';

var Promise = require('bluebird');

/**
 * Takes an EventEmitter and converts it into a function that returns a promise.
 * @param {object} params                 Object that contains parameters
 * @param {object} params.eventEmitter    Function that returns an event emitter
 * @param {object} params.applyThis       This function performs a params.eventEmitter.apply
 *                                        If the "this" object needs to be different, set it here.
 * @param {object} params.listeners       List of event listeners.
 *                                        Must contain the following:
 *                                        - on/once: the function to run 'on' all events or 'once' an event is emitted
 *                                        - name: name of event
 *                                        - isResult: when set to true, the argument passed into this function will be
 *                                          treated as a result when the promise is resolved
 *                                        - isError: the error handler
 * @param {function} params.transform     Transforms the result before resolving it
 * @returns {function}
 */
var promisifyEventEmitter = function(params) {
  if (!params.eventEmitter) {
    throw new Error('params.eventEmitter is required');
  }
  if (params.listeners && !Array.isArray(params.listeners)) {
    throw new Error('params.listeners must be an array of listener options objects');
  }
  if (params.listeners) {
    params.listeners.forEach(function(listenerOption) {
      if (!listenerOption.name) {
        throw new Error('listener option must have a name');
      }
      if (!listenerOption.on && !listenerOption.once) {
        throw new Error('listener option must have a "once" or "on" function');
      }
      if (listenerOption.on && typeof listenerOption.on !== 'function') {
        throw new Error('"on" must be a function');
      }
      if (listenerOption.once && typeof listenerOption.once !== 'function') {
        throw new Error('"once" must be a function');
      }
    });
  }
  return function() {
    var args = arguments;
    var applyThis = params.applyThis || params.eventEmitter;
    var e = params.eventEmitter.apply(applyThis, args);
    var error;
    var result;
    var hasDataListener = false;
    var hasErrorListener = false;
    var hasEndListener = false;
    var addListener = function (listener, method) {
      e[method](listener.name, function (arg) {
        /** @namespace listener.isResult */
        if (listener.isResult) {
          hasDataListener = true;
          result = arg;
        }
        /** @namespace listener.isError */
        if (listener.isError) {
          hasErrorListener = true;
          error = arg;
        }
        listener[method](arg);
        if (listener.name === 'end') {
          hasEndListener = true;
          endFunction();
        }
      });
    };
    params.listeners.forEach(function(listenerOptions) {
      /** @namespace listenerOptions.on */
      /** @namespace listenerOptions.once */
      if (listenerOptions.on) {
        addListener(listenerOptions, 'on');
      } else if (listenerOptions.once) {
        addListener(listenerOptions, 'once');
      }
    });
    if (!hasDataListener) {
      e.once('data', function(data) {
        result = data;
      });
    }
    if (!hasErrorListener) {
      e.on('error', function(err) {
        error = err;
      });
    }
    return new Promise(function(resolve, reject) {
      var endFunction = function() {
        if (error) {
          return reject(error);
        }
        var resolveThis = params.transform && result ? params.transform(result) : result;
        return resolve(resolveThis);
      };
      if (!hasEndListener) {
        e.once('end', endFunction);
      }
    });
  };
};

module.exports = promisifyEventEmitter;

"use strict"

var Promise = require('bluebird'),
    request = require('superagent'),
    join = require('url-join'),
    _ = require('lodash'),
    connector = require('./connector');


function insert(modelName, instance, models, cb) {
    connector.insertInstance(modelName, instance, models, cb);
}

module.exports = {
    insert: insert
}
Promise.promisifyAll(module.exports);

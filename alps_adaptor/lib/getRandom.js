"use strict"

var Promise = require('bluebird'),
    connector = require('./connector');

module.exports = connector.getRandomInstance;

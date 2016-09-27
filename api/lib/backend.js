"use strict";

var path = require('path');
var config = require('../config');
var backend;

function getBackend() {
    if (!backend) {
        backend = require('nitrodata_' + config.adaptor);
    }
    return backend;
}

function clobberBackend(backendToInject) {
    backend = backendToInject;
}

module.exports = {
    getBackend: getBackend,
    clobberBackend: clobberBackend
}

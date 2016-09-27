'use strict';

var path = require('path');
var fs = require('fs');
var _exports = {};


/**
 *Read in all the .js files in this directory so all factories
 *can be 'required' with one require statement
 */
fs.readdirSync(__dirname).forEach(function (filename) {
    var modelName;
    if (path.extname(filename) === '.js') {
        modelName = path.basename(filename, '.js');
        if (modelName === 'index') {
            // skip this file`
            return
        }
        _exports[modelName] = require(path.join(__dirname, filename));
    }
});

module.exports = _exports;

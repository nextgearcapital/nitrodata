var _ = require('lodash');
var request = require('requestretry');
var models = require('./generated/models');
var common = require('./lib/common');
var Promise = require('bluebird');
var swig = require('swig');
var config = require('./config');
var url = require('url');
var prettyModelDefs = require('./lib/prettyModels.js').getPrettyModels();

function create(instanceReq, cb) {
    var options = {
        method: 'POST',
        url: url.resolve(config.server_url, 'createRecords'),
        maxAttempts: 3,
        retryDelay: .5,
        retryStrategy: request.RetryStrategies.NetworkError,
        json: instanceReq.getData()
    };

    request(options, function (err, res) {
        if (err) {
            console.log('Error:', err);
            return cb(err);
        }
        if (res.statusCode !== 200) {
            return cb(new Error(res.body));
        }
        var records = res.body;
        cb(null, records);
    });
}

function updateRecords(instanceReq, where, cb) {
    var options = {
        method: 'POST',
        url: url.resolve(config.server_url, 'updateRecords'),
        maxAttempts: 3,
        retryDelay: .5,
        retryStrategy: request.RetryStrategies.NetworkError,
        json: {
            "model": instanceReq.modelName,
            "attributes": instanceReq.attributes,
            "where": where,
            "count": 1
        }
    };

    request(options, function (err, res) {
        if (err) {
            console.log('Error:', err);
            return cb(err);
        }
        if (res.statusCode !== 200) {
            return cb(new Error(res.body));
        }
        var records = res.body;
        cb(null, records);
    });
}

function findRecords(instanceReq, count, _cb) {
    var cb = _cb;
    var recordCount = count;
    if (typeof count === "function") {
        cb = count;
        recordCount = 1;
    }

    var options = {
        method: 'GET',
        url: url.resolve(config.server_url, 'findRecords'),
        maxAttempts: 3,
        retryDelay: .5,
        retryStrategy: request.RetryStrategies.NetworkError,
        json: {
            "model": instanceReq.modelName,
            "attributes": instanceReq.attributes,
            "count": recordCount 
        }
    };

    request(options, function (err, res) {

        if (err) {
            console.log('Error:', err);
            return cb(err);
        }
        if (res.statusCode !== 200) {
            return cb(new Error(res.body));
        }
        var records = res.body;
        cb(null, records);
    });
}

function extractAsCreateStatements(instanceReq, dependencySearchDepthRemaining, cb) {
    var options = {
        method: 'GET',
        url: 'http://localhost:3000/extractAsCreate',
        maxAttempts: 3,
        retryDelay: .5,
        retryStrategy: request.RetryStrategies.NetworkError,
        json: {
            "model": instanceReq.modelName,
            "attributes": instanceReq.attributes,
            "dependencySearchDepthRemaining": dependencySearchDepthRemaining
        }
    };

    request(options, function (err, res) {
        if (err) {
            console.log('Error:', err);
            return cb(err);
        }
        if (res.statusCode !== 200) {
            console.log('Error:', res.body);
            return cb(new Error(res.body));
        }
        var extract = res.body;
        cb(null, extract);
    });
}

function deleteRecords(instanceReq, cb) {
    var options = {
        method: 'POST',
        url: url.resolve(config.server_url, 'deleteRecords'),
        maxAttempts: 3,
        retryDelay: .5,
        retryStrategy: request.RetryStrategies.NetworkError,
        json: {
            "model": instanceReq.modelName,
            "attributes": instanceReq.attributes,
        }
    };

    request(options, function (err, res) {
        if (err) {
            console.log('Error:', err);
            return cb(err);
        }
        if (res.statusCode !== 200) {
            console.log('Error:', res.body);
            return cb(new Error(res.body));
        }
        var records = res.body;
        cb(null, records);
    });
}

function aggregateResultsArray(_results) {
        var results = {};
        if (Array.isArray(_results)) {
            _.each(_results, function (result) {
                common.merge(results, result);
            })
        } else {
            common.merge(results, result);
        }
        return results;
    }

function displayResults(results, annotation ) {
    if (typeof results === 'string') {
        //this magic supports: .then(displayResults('my annotation')) but doesn't work with std cb
        //note: on first pass the string was the annotation not the results but
        //      on second pass it's the results...remember, it's magic!
        //if there is no annotation, just falls through with results as only arg
        annotation = results;
        return _.partialRight(displayResults, annotation);
    };

    //override annotation if passed else default...
    annotation = annotation || "raw results object(s)";

    //display raw results object...
    console.log('%s:\n%s', annotation, JSON.stringify(results, null, 4));

    var cntModel = 0;
    //spin thru each model type in result set...
    _.forEach(results, function (value, key) {
        var cnt = 0;
        cntModel++;
        //match each results model to the modelDefs...
        _.forEach(results[key], function(obj) {
            if (_.has(prettyModelDefs, key) && _.has(prettyModelDefs[key], 'display')) {
                //we have a modelDef and a display key so format and display it...
                cnt++;
                //key + cnt + ": " prepends each model display with modelName and occurence number and
                //prettyModelDefs[key].display is the swig formatted custom display from model overrides...
                var strFormat = key + cnt + ": " + prettyModelDefs[key].display;
                var strFinal = swig.render(strFormat, {locals: obj });
                console.log(strFinal);
                if (process.stdout.isTTY && strFinal.length > process.stdout.getWindowSize()[0] && cnt < results[key].length) {
                    console.log(' ');
                }
            }
        });
        if (cnt > 0 && cntModel < _.size(results)) {
            console.log('     - - - - - ');
        }
    });
    
    return (null, results);
};

var _exports = {
    create: create,
    update: updateRecords,
    find:   findRecords,
    models: models.default,
    nsModels: models.nsModels,
    merge: common.merge,
    delete: deleteRecords,
    extractAsCreate: extractAsCreateStatements,
    Promise: Promise,
    aggregateResultsArray: aggregateResultsArray,
    displayResults: displayResults
}
Promise.promisifyAll(_exports);
module.exports = _exports;

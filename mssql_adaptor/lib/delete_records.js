'use strict';

var sqlBuilder = require('./sql_builder');
var db = require('./db');
var common = require('./common.js');
var accumulate = common.accumulate;

function deleteRecords(instanceReqs, models, cb) {
    var modelName = instanceReqs.model;
    var querySQL = sqlBuilder.deleteRows(models, instanceReqs);

    db.execQuery(querySQL, function (err, records) {
        if (!err) {
            var recordsToReturn = {};
            accumulate(recordsToReturn, records, modelName);
            cb(null, recordsToReturn);
        } else {
            cb(err);
        }
    });
}

module.exports = deleteRecords;

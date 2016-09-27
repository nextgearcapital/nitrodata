'use strict';

var sqlBuilder = require('./sql_builder');
var db = require('./db');
var common = require('./common.js');
var accumulate = common.accumulate;

function findRecords(instanceReqs, models, cb) {
    var modelName = instanceReqs.model;

    var querySQL = sqlBuilder.findRows(models, instanceReqs);

    db.execQuery(querySQL, function (err, records) {
        if (!err) {
            cb(null, records);
        } else {
            cb(err);
        }
    });
}

module.exports = findRecords;

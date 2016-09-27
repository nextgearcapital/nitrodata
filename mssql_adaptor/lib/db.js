'use strict';

var sql = require('mssql'),
    logger = require('./logging').getDefault(),
    connection;
var _ = require('lodash');
var typeLookup = {};
var config;

// make lookup table for types using lower case type names
_.forOwn(sql.TYPES, function (typeObject, typeName) {
    typeLookup[typeName.toLowerCase()] = typeName;
});

function getTypeObject(typeName) {
    return sql[typeLookup[typeName]];
}

function getConfig() {
    return config;
}

function connectToDb(_config, cb) {
    config = _config;
    connection = new sql.Connection(config, function (err) {
        if (!err) {
            logger.info(
                'connected to [' + config.database + '] database on [' + config.server + ']'
            );
            return cb(null, connection);
        } else {
            logger.error(
                'error connecting to [' + config.database + '] database on [' + config.server + ']',
                err);
            return cb(err);
        }
    });
}

function execQuery(query, cb) {
    var request = new sql.Request(connection);
    request.query(query, function (err, recordset) {
        if (err) {
            logger.error('error running query', err);
            return cb(err);
        }
        recordset = _.map(recordset, cleanRecord);
        return cb(null, recordset);
    });
}

function execParameterizedQuery(query, params, cb) {
    var request = new sql.Request(connection);
    _.each(params, function (fieldParams) {
        if (fieldParams.length === 3) {
            // type info has been passed in
            // look up type object from mssql module
            var typeName = fieldParams[1];
            fieldParams[1] = getTypeObject(typeName);
            if (typeName === 'datetime') {
                fieldParams[2] = new Date(fieldParams[2]); 
            }
        }
        request.input.apply(request, fieldParams);
    });

    request.query(query, function (err, recordset) {
        if (err) {
            return cb(err);
        }
        recordset = _.map(recordset, cleanRecord);
        return cb(null, recordset);
    });
}

function getConnection() {
    return connection;
}

function cleanRecord(record) {
    _.forOwn(record, function (fieldValue, fieldName) {
        if (Buffer.isBuffer(fieldValue)) {
            record[fieldName] = '0x' + fieldValue.toString('hex');
        }
    });
    return record;
}

module.exports = {
    connectToDb: connectToDb,
    execQuery: execQuery,
    execParameterizedQuery: execParameterizedQuery,
    getConnection: getConnection,
    getConfig: getConfig
};

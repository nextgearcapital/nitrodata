'use strict';

var //fs = require("fs"),
    //util = require('util'),
    path = require('path'),
    _ = require('lodash'),
    swig = require('swig'),
    pluralize = require('pluralize'),
    db = require('./db'),
    logger = require('./logging').getDefault();

pluralize.addSingularRule(/data$/i, 'data');
pluralize.addSingularRule(/caches$/i, 'cache');

function camelCase(input) {
    return input.replace(/(\_[a-z])/g, function (q) {
        return q.toUpperCase().replace('_','');
    });
}

function removeId(fieldName) {
    if (_.endsWith(fieldName, '_id')) {
        return fieldName.slice(0,-3);
    } else if (_.endsWith(fieldName, 'Id')) {
        return fieldName.slice(0, -2);
    } else {
        return fieldName;
    }
}

function singularizeSnakeCase(pluralName) {
    var words = pluralName.split('_');
    var lastWord = words.pop();
    lastWord = pluralize(lastWord, 1);
    words.push(lastWord);
    return words.join('_');
}

function singleCamel(tableName) {
    return camelCase(singularizeSnakeCase(tableName));
}

function getAllTriggers(cb) {
    var query = swig.renderFile(path.join(__dirname, 'templates', 'get_triggers.sql.swig'), {
    });
    db.execQuery(query, function (err, records) {
        if (err) { return cb(err); }
        return cb(null, records);
    });
}

function getAllTriggersByTable(cb) {
    getAllTriggers(function(err, triggers) {
        if (err) { return cb(err); }
        getAllDmlDependencies(function(err, deps) {
            var triggerData = {};
            if (err) { return cb(err); }

            _.forEach(triggers, function(t) {
                if ( !_.has(triggerData, t.table_name) ) { // jshint ignore:line
                    triggerData[t.table_name] = []; // jshint ignore:line
                }
                t.dependencies = deps[t.trigger_name]; // jshint ignore:line
                triggerData[t.table_name].push(t); // jshint ignore:line
            });
            cb(null, triggerData);
        });
    });
}

function getAllDmlDependencies(cb) {
    var myDMLs = {};
    getDmlDependencies(null, function (err, records) {
        if (err) { return cb(err); }
        _.forEach(records, function(d) {
            if ( !_.has(myDMLs, d.referencing_entity_name) ) { // jshint ignore:line
                myDMLs[d.referencing_entity_name] = []; // jshint ignore:line
            }
            myDMLs[d.referencing_entity_name].push(d); // jshint ignore:line
        });
        cb(null, myDMLs);
	});

}

function getDmlDependencies(dmlName, cb) {
    var query = swig.renderFile(path.join(__dirname, 'templates', 'get_dml_dependencies.sql.swig'), {
        dmlName: dmlName
    });
    db.execQuery(query, function (err, records) {
        if (err) { return cb(err); }
        return cb(null, records);
	});

}

module.exports = function (cb) {
    var //modeldir = './models',
        allModelsDef = {},
        query;

    logger.info('generating models');

    query = swig.renderFile(path.join(__dirname, 'templates', 'get_info_about_table.sql'), {
        table: null
    });

    getAllTriggersByTable(function(err, triggerData) {
        db.execQuery(query, function (err, records) {
            if (err) {
                cb(err);
            }

            _.each(records, function (r) {
                var fieldData = { value: {} },
                    isNullable = (r.IS_NULLABLE === 'YES'),
                    isIdentity = (r.IS_IDENTITY === 'YES'),
                    isComputed = (r.IS_COMPUTED === 1),
                    fullModelName = r.TABLE_SCHEMA + '.' + r.TABLE_NAME;

                // attempt to pick a sensible default config for fields
                if (r.TargetTable) {
                    fieldData.value.customFaker = 'foreignKey.random';
                    fieldData.targetTable = r.TargetSchema + '.' + r.TargetTable;
                    fieldData.targetColumn = r.TargetColumn;
                } else {
                    if (r.DATA_TYPE === 'datetime') {
                        fieldData.value.fakerFunction = 'faker.date.past()';
                    } else if (r.DATA_TYPE === 'bit') {
                        fieldData.value.fakerFunction = 'faker.random.boolean()';
                    } else if (r.DATA_TYPE === 'int' ||
                        r.DATA_TYPE === 'bigint') {
                        fieldData.value.fakerFunction = 'faker.random.number()';
                    } else if (r.DATA_TYPE === 'smallint') {
                        fieldData.value.fakerFunction = 'faker.random.number({min: 0, max:32767})';
                    } else if (r.DATA_TYPE === 'tinyint') {
                        fieldData.value.fakerFunction = 'faker.random.number({min: 0, max:255})';
                    } else if (r.DATA_TYPE === 'money') {
                        fieldData.value.fakerFunction = 'faker.finance.amount()';
                    } else if (r.DATA_TYPE === 'timestamp') {
                        fieldData.enable = false;
                    } else if (r.DATA_TYPE === 'varbinary') {
                        fieldData.enable = false;
                    } else if (r.DATA_TYPE === 'uniqueidentifier') {
                        fieldData.value.fakerFunction = 'faker.random.uuid()';
                    } else if (r.DATA_TYPE === 'geography') {
                        fieldData.enable = false;
                    } else if (isNullable) {
                        fieldData.value.default = null;
                    } else {
                        // running out of sensible defaults
                        fieldData.value.default = '??';
                    }
                }
                if (isIdentity || isComputed) {
                    fieldData.enable = false;
                }
                if (r.CHARACTER_MAXIMUM_LENGTH) {
                    fieldData.maxLength = r.CHARACTER_MAXIMUM_LENGTH;
                }
                fieldData.type = r.DATA_TYPE;
                fieldData.isNullable = isNullable;
                fieldData.isIdentity = isIdentity;
                fieldData.isComputed = isComputed;
                fieldData.isPrimaryKey = (r.IS_PRIMARY_KEY === 'YES');

                fieldData.prettyName = _.camelCase(r.COLUMN_NAME);
                if ( r.TargetTable) {
                    fieldData.prettyTargetTable = removeId(fieldData.prettyName);
                }

                fieldData.myName = r.COLUMN_NAME;
                fieldData.myParentModel = r.TABLE_NAME;

                if ( !(fullModelName in allModelsDef) ) {
                    allModelsDef[fullModelName] = {
                        prettyName: singleCamel(r.TABLE_NAME),
                        namespace: r.TABLE_SCHEMA,
                        fields: {}};
                }
                allModelsDef[fullModelName].fields[r.COLUMN_NAME] = fieldData;
            });
            _.each(allModelsDef, function (modelDef, tableName) {
                modelDef.triggers = triggerData[tableName];
            });
            return cb(null, allModelsDef);
        });
    });
};

'use strict';

var _ = require('lodash'),
    util = require('util'),
    logger = require('./logging').getDefault(),
    db = require('./db')
    
function getEncryptionStrings() {
    var config = db.getConfig();
    var key = config.options.encryption_key;
    var cert = config.options.encryption_cert;
    return {
        initSql: util.format(" OPEN SYMMETRIC KEY %s DECRYPTION BY CERTIFICATE %s; ", key, cert),
        selectClause: function (fieldName) {
            return util.format("CONVERT(varchar(50), DECRYPTBYKEYAUTOCERT(cert_ID('%s'), NULL, %s))", cert, fieldName);
        },
        updateClause: function (fieldName, fieldValue) {
            return util.format("%s = EncryptByKey(Key_GUID('%s'), CONVERT(VARBINARY(300), '%s'))", fieldName, key, fieldValue);
        },
        insertClause: function (fieldName) {
            return util.format("EncryptByKey(Key_GUID('%s'), CONVERT(VARBINARY(300), @%s))", key, fieldName); 
        }
    };
}
function getEncryptedFieldNames(modelFieldDefs) {
    var encryptedFieldNames = [];
    _.forOwn(modelFieldDefs, function(value, key) {
        if (value.isEncrypted) {
            encryptedFieldNames.push(key);
        }
    });
    return encryptedFieldNames;
}    
    
function keyFieldNames(modelDef) {
    var names = [];
    _.forOwn(modelDef.fields, function(fieldDef, fieldName) {
        if (fieldDef.isPrimaryKey) {
            names.push(fieldName);
        }
    });
    return names;
}

function keyFieldSqlDefs(modelDef) {
    var sqlDefs = [];
    _.forOwn(modelDef.fields, function(fieldDef, fieldName) {
        if (fieldDef.isPrimaryKey) {
            if (fieldDef.maxLength) {
                sqlDefs.push(util.format("%s %s(%s)", fieldName, fieldDef.type, fieldDef.maxLength));
            } else {
                sqlDefs.push(util.format("%s %s", fieldName, fieldDef.type));
            }
        }
    });
    return sqlDefs;
}

function encryptedFieldNames(modelDef) {
    var names = [];
    _.forOwn(modelDef.fields, function(fieldDef, fieldName) {
            if (fieldDef.isEncrypted) {
                names.push(fieldName);
            }
    });
    return names;
}

function selectClauseWithDecryption(modelDef, tableAlias) {
    var tableAlias = (tableAlias || '');
    if (tableAlias.length) tableAlias += '.';
    var selectClauses = [ tableAlias + '*' ];
    _.map(encryptedFieldNames(modelDef), function (fieldName) {
        selectClauses.push("decrypted_" + fieldName + " = " + getEncryptionStrings().selectClause(tableAlias + fieldName));
    });
    var selectClause = selectClauses.join(', ');
    return selectClause;
}     

function whereClause(fieldDefs, fieldNames, fieldValues) {
    var conditions = '';
    for (var i = 0; i < fieldValues.length; i++) {
        var fieldDef = fieldDefs[fieldNames[i]]; 
        if (fieldDef && !fieldDef.isEncrypted) {
            if (conditions.length === 0) {
                conditions = ' WHERE ';
            } else {
                conditions += " AND ";
            }
            if (fieldValues[i] === undefined) {
                conditions += '';
            } 
            else if (fieldValues[i] === null) {
                conditions += fieldNames[i] + ' IS NULL';
            }
            else if (fieldDef.type === 'timestamp') {
                conditions += fieldNames[i] + ' = ' + "CAST('" + fieldValues[i].toString().replace(/'/g, "''") + "' AS TIMESTAMP)";
            }
            else {
                conditions += fieldNames[i] + ' = ' + "'" + fieldValues[i].toString().replace(/'/g, "''") + "'";
            }
        }
    }

    return conditions;
}    

function createSqlForKeysTempTable(tempTableName, modelDef) {
    var sql = 'CREATE TABLE #' + tempTableName + ' ( ' + keyFieldSqlDefs(modelDef).join(', ') + ' );';
    return sql;  
}

function dropSqlForKeysTempTable(tempTableName, modelDef) {
    var sql = 'DROP TABLE #' + tempTableName;
    return sql;  
}

function whereRecordsWereAffected(tempTableName, modelDef) {
    var whereKeys = _.map(keyFieldNames(modelDef), function (fieldName) {
        return fieldName + ' = (SELECT ' + fieldName + ' FROM #' + tempTableName + ')';
    }).join(' AND ');
    return 'WHERE ' + whereKeys;
}

function fromJoinFilteredByKeys(tempTableName, modelDef, modelName, tableAlias) {
    var joinSql = modelName + ' ' + tableAlias + ' INNER JOIN #' + tempTableName + ' ON ';
    var kfn = keyFieldNames(modelDef);
    _.forEach(kfn, function(fieldName) {
       if (!_.endsWith(joinSql, 'ON ')) joinSql += ' AND ';
       joinSql += tableAlias + '.' + fieldName + ' = #' + tempTableName + '.' + fieldName; 
    });
    return joinSql;
}

function outputClauseForKeysTempTable(tempTableName, modelDef, fieldNamesToInsert) {
    var insKeys = _.map(keyFieldNames(modelDef), function (fieldName) {
        return 'INSERTED.' + fieldName + '';
    }).join(', ');

    var encrypted = encryptedFieldNames(modelDef);
    var rowValues = _.map(fieldNamesToInsert, function (fieldName) {
        if ( _.indexOf(encrypted, fieldName) > -1 ) {
            return getEncryptionStrings().insertClause(fieldName);
        } else {
            return "@" + fieldName;
        }
    }).join(', ');
    var valueClause = rowValues.length > 0 ? 'VALUES (' + rowValues + ')' : '';

    var output = util.format('OUTPUT %s INTO #%s', insKeys, tempTableName, valueClause);
    return output;  
}

function createParameterizedInsert(models, modelName, instance) {
    var modelDef = models.getModelDef(modelName);

    var columnNames = _.map(_.keys(instance), function (fieldName) {
        return '"' + fieldName + '"';
    }).join(', ');
    
    var fieldNamesToSelect = _.keys(instance);

    // 'dbo.branches' -> [dbo].[branches]
    var modelNameParts = _.map(modelName.split('.'), function(n) { return '[' + n + ']' });
    var _modelName = modelNameParts.join('.');

    var queryFormatter = '%s %sINSERT INTO %s (%s) %s; SELECT %s FROM %s %s; %s';
    var query = util.format(queryFormatter,
        createSqlForKeysTempTable('T', modelDef), 
        (encryptedFieldNames(modelDef).length > 0) ? getEncryptionStrings().initSql : "",
        _modelName,
        columnNames,
        outputClauseForKeysTempTable('T', modelDef, fieldNamesToSelect),
        selectClauseWithDecryption(modelDef),
        _modelName,
        whereRecordsWereAffected('T', modelDef),
        dropSqlForKeysTempTable('T')
    );

    logger.debug('query =', query);
    return query;
}

function updateRow(models, modelName, instance, where) {
    var columnAndValue = [];
        
    var modelDef = models.getModelDef(modelName);

    _.forOwn(instance, function(value, key) {
        if (_.indexOf(encryptedFieldNames(modelDef), key) > -1) {
            columnAndValue.push(getEncryptionStrings().updateClause(key, value));
        } else {
            columnAndValue.push(key + " = '" + value + "'");
        }
    });
    
    var queryFormatter = '%s %sUPDATE %s SET %s %s WHERE %s; SELECT %s FROM %s; %s';
    var query = util.format(queryFormatter,
        createSqlForKeysTempTable('T', modelDef), 
        (encryptedFieldNames(modelDef).length > 0) ? getEncryptionStrings().initSql : "",
        modelName,
        columnAndValue.join(', '),
        outputClauseForKeysTempTable('T', modelDef),
        where,
        selectClauseWithDecryption(modelDef, 'upd'),
        fromJoinFilteredByKeys('T', modelDef, modelName, 'upd'),
        dropSqlForKeysTempTable('T')
    );

    return query;
}

function getRandomFromTable(tableName) {
    var insert0 = 'SELECT TOP 1 * FROM ',
        insert1 = ' ORDER BY NEWID()',
        query;

    query = insert0 + tableName + insert1;

    logger.debug('query =', query);
    return query;
}

function findRows(models, instanceReqs) {
    var columnNames = _.keys(instanceReqs.attributes);
    var rowValues = _.values(instanceReqs.attributes);

    var modelDef = models.getModelDef(instanceReqs.model);

    var queryFormatter = 'SELECT TOP %s %s FROM %s %s ORDER BY NEWID()';
    var query = util.format(queryFormatter,
        instanceReqs.count ? instanceReqs.count : '1',
        selectClauseWithDecryption(modelDef),
        instanceReqs.model,
        whereClause(modelDef.fields, columnNames, rowValues));
    logger.debug('query =', query);
    return query;
}

function deleteRows(models, body) {
    var columnNames = _.keys(body.attributes);
    var rowValues = _.values(body.attributes);
    var modelDef = models.getModelDef(body.model);

    var queryFormatter = 'DELETE %s %s';
    var query = util.format(queryFormatter,
        body.model,
        whereClause(modelDef.fields, columnNames, rowValues));
    logger.debug('query =', query);
    return query;
}

module.exports = {
    createParameterizedInsert: createParameterizedInsert,
    updateRow: updateRow,
    findRows: findRows,
    deleteRows: deleteRows,
    getRandomFromTable: getRandomFromTable
};

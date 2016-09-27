var _ = require('lodash'),
    sqlBuilder = require('./sql_builder'),
    logger = require('./logging').getDefault(),
    common = require('./common.js'),
    accumulate = common.accumulate,
    db = require('./db');


function insert(modelName, instance, models, cb) {
    var modelDef = models.getModelDef(modelName);
    var insertSQL;
    var parameters = [];


    insertSQL = sqlBuilder.createParameterizedInsert(models, modelName, instance);
    _.forOwn(instance, function (value, fieldname) {
        var typeData;
        if (modelDef && _.isObject(modelDef.fields) && modelDef.fields[fieldname]) {
            typeData = modelDef.fields[fieldname].type || null;
        }
        if (typeData && value !== null && typeData !== 'decimal') {
            parameters.push([fieldname, typeData, value]);
        } else {
            parameters.push([fieldname, value]);
        }
    });

    db.execParameterizedQuery(insertSQL, parameters, cb);
}


module.exports = insert;

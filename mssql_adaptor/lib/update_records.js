var _ = require('lodash'),
    sqlBuilder = require('./sql_builder'),
    logger = require('./logging').getDefault(),
    common = require('./common.js'),
    accumulate = common.accumulate,
    db = require('./db');

function update(instanceReqs, models, cb) {
    if (_.size(instanceReqs.attributes) === 0) {
        return cb(new Error('Error with update request: ' + JSON.stringify(instanceReqs) + ' -- ' + 'No attributes were specified.'));
    }
    
    if (!instanceReqs.where || instanceReqs.where.length === 0) {
        return cb(new Error('Error with update request: ' + JSON.stringify(instanceReqs) + ' -- ' + 'No conditions were specified.'));
    }

    var updateSQL,
        instance = {},
        where = instanceReqs.where,
        modelName = instanceReqs.model;

    _.forEach(instanceReqs.attributes, function(value, key) {
        instance[key] = value;
    });

    updateSQL = sqlBuilder.updateRow(models, modelName, instance, where);

    db.execQuery(updateSQL, function (err, records) {
        if (!err) {
            if (records.length === 0) {
                return cb(new Error('Error trying to update: ' + JSON.stringify(instanceReqs) + ' -- ' + 'No record was found matching conditions.'));
            }
            else {
                logger.debug('Updated [' + modelName + '] record. --', records);
                
                cb(null, records);
            }
        } else {
            err.message = 'Error while trying to update: ' + JSON.stringify(instanceReqs) + ' -- ' + err.message;
            cb(err);
        }
    });
}

module.exports = update;

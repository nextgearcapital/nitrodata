var _ = require('lodash'),
    models = require('./models'),
    dataGenerator = require('./data_generator')(models),
    logger = require('./logging').getDefault(),
    common = require('./common.js'),
    config = require('../config.js'),
    accumulate = common.accumulate,
    backend = require('./backend').getBackend();

function fakeAndInsert(instanceReqs, instances, cb) {
    dataGenerator(instanceReqs, instances, function (err, instance) {
        if (err) {
            return cb(err);
        }
        var modelName = instanceReqs.model,
            createMode = instanceReqs.createMode || config.default_create_mode,  // jshint ignore:line
            modelDef = models.getModelDef(modelName);

        if (createMode === 'useServerDefault') {
            createMode = config.default_create_mode;
        }

        if (createMode === 'createNew') {
            // bypass all find logic, simply create a new instance
            return insert(modelName, instance);
        }

        // createMode must be either useExisting or createIfDoesNotExist
        backend.findRecords(instanceReqs, models, function (err, records) {
            if (!err) {
                if (records.length > 0) {
                    logger.debug('Criteria Match, using found [' + modelName + '] record. --', records);
                    accumulate(instances, records, modelName);
                    cb(null, records);
                }
                else {
                    if (createMode === 'useExisting') {
                        logger.warn("Couldn't find existing record for [" + modelName + "], but useExisting was set.  instanceReqs = %s", JSON.stringify(instanceReqs, null, 4));
                        var err = new Error("Couldn't find existing record for [" + modelName + "], but useExisting was set");
                        return cb(err);
                    }
                    // createMode === createIfDoesNotExist
                    insert(modelName, instance);
                }
            } else {
                cb(err);
            }
        });

        function insert(modelName, instance) {
            backend.insertRecord(modelName, instance, models, function (err, records) {
                if (!err) {
                    logger.debug('No Criteria Match, inserted new [' + modelName + '] record. --', records);
                    accumulate(instances, records, modelName);
                    cb(null, records);
                } else {
                    err.message = 'Error while trying to insert: ' + JSON.stringify(instanceReqs) + ' -- ' + err.message;
                    cb(err);
                }
            });
        }
    });
}

module.exports = fakeAndInsert;

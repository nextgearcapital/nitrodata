var _ = require('lodash');

function merge(target, source) {
    if (target === undefined) {
        target = {};
    }
    if (source === undefined) {
        return;
    }
    _.forEach(source, function(sourceArray, key) {
        if (!_.has(target, key)) {
            target[key] = [];
        }
        var alreadyIn = false;
        _.forEach(source[key], function(sourceInstance) {
            alreadyIn = false;
            _.forEach(target[key], function(targetInstance) {
                if (_.has(targetInstance, 'id') && _.has(sourceInstance, 'id')) {
                    //console.log('source.id: %s, target.id: %s, key: %s', sourceInstance.id, targetInstance.id, key);
                    if (sourceInstance.id === targetInstance.id) {
                        //console.log('not going to insert matching id for ids: %s, %s', sourceInstance.id, targetInstance.id);
                        alreadyIn = true;
                    }
                }
            });
            if (alreadyIn === false) {
                target[key].push(sourceInstance);
            }
        });
    });
}

function accumulate(accumulator, adds, modelName) {
    if (!adds || adds.length < 1) return;
    accumulator = accumulator || {};
    accumulator[modelName] = accumulator[modelName] || [];

    accumulator[modelName] = _.unionWith(accumulator[modelName], adds, _.isEqual);
}

function prettifyAccumulator(accumulator, models) {
    var prettyAccumulator = {},
        accumulator = _.cloneDeep(accumulator);

    _.forEach(accumulator, function(instances, modelName) {
        var prettyModelName = models.getModelDef(modelName).prettyName;
        prettyAccumulator[prettyModelName] = prettyAccumulator[prettyModelName] || [];
        _.forEach(instances, function(instance) {
            var prettyInstance = prettifyInstance(instance, models.getModelDef(modelName));
            prettyAccumulator[ prettyModelName ].push( prettyInstance );
        });
    });

    return prettyAccumulator;
}

function prettifyInstance(instance, modelDef) {
    var modelFields = modelDef.fields,
        instanceTarget = {};
    _.forEach(instance, function(value, fieldName) {
        var fieldDef = _.get(modelFields, fieldName);
        if (fieldDef) {
            var prettyName = fieldDef.prettyName;
            if (fieldDef.isEncrypted) {
                var decryptedValue = _.get(instance, 'decrypted_' + fieldName);
                instanceTarget[ prettyName ] = decryptedValue;
                prettyName = prettyName + 'Encrypted';
            }
            instanceTarget[ prettyName ] = value;
        };
    });
    return instanceTarget;
}

module.exports = {
    merge: merge,
    accumulate: accumulate,
    prettifyAccumulator: prettifyAccumulator
};

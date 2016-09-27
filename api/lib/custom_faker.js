"use strict";

var _ = require('lodash'),
    faker = require('faker'),
    backend = require('./backend').getBackend(),
    logger = require('./logging').getDefault(),
    foreignKey;

function phone(model, instanceReqs, instances, cb) {
    var formattedNumber = faker.phone.phoneNumberFormat(1).replace(/\D/g,'');
    return cb(null, formattedNumber);
}

function smallInt(model, instanceReqs, cb) {
    return cb(null, _.random(-32768, 32767));
}

function tinyInt(model, instanceReqs, cb) {
    return cb(null, _.random(0, 255));
}

foreignKey = {
    random: function (model, instanceReqs, instances, cb) {
        if (instanceReqs) {
            var fakeAndInsert = require('./fake_and_insert');
            fakeAndInsert(instanceReqs, instances, function (err, records) {
                if (err) { return cb(err); }
                var value;
                if (records.length > 0 ) {
                    value = records[0][model.targetColumn];
                } else  {
                    value = null;
                }
                return cb(null,value);
            });
        } else {
            backend.getRandom(model.targetTable, function (err, records) {
                var targetValue;
                if (err) { return cb(err); }
                if (records.length > 0 ) {
                    targetValue = records[0][model.targetColumn];
                    return cb(null, targetValue);
                } else {
                    if (model.isNullable === false) {
                        logger.warn('could not find record for non-nullable column: %s.%s', model.myParentModel, model.myName);
                        var emptyInstanceReqs = { model: model.targetTable, attributes: {}, count: 1 };
                        foreignKey.random(model, emptyInstanceReqs, instances, cb);
                    } else {
                        logger.info('could not find record for nullable column: %s.%s', model.myParentModel, model.myName);
                        return cb(null, null);
                    }
                }
            });
        }
    },
    create: function (model, instanceReqs, instances, cb) {
        var instanceRequirements = {
            model: model.targetTable,
            attributes: {},
            createMode: 'createNew',
            count: 1
        };

        var fakeAndInsert = require('./fake_and_insert');
        fakeAndInsert(instanceRequirements, instances, function (err, records) {
            if (!err) {
                var value;
                if (records.length > 0 ) {
                    value = records[0][model.targetColumn];
                } else  {
                    value = null;
                }
                return cb(null, value);
            } else {
                logger.error(err);
                cb(err);
            }
        });
    }
};


module.exports = {
    phone: phone,
    foreignKey: foreignKey,
    smallInt: smallInt,
    tinyInt: tinyInt
};

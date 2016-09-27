"use strict";

var _ = require('lodash'),
    logger = require('./logging').getDefault(),
    customFaker = require('./custom_faker'),
    vm = require('vm'),
    sandbox = require('./sandbox');


module.exports = function (models) {
    function callCustomFakerFunctions(modelName, defForModel, instance, instanceReqs, instances, cb) {
        var customFakerCalls = [],
            callbackCounter = 0,
            callbackTotal;

        function checkForFinalCallback(fieldName) {
            callbackCounter++;
            if (callbackCounter === callbackTotal) {
                return cb(null, instance);
            }
        }

        _.forOwn(defForModel, function (fieldDef, fieldName) {
            var customFakerFunc, fieldValue, subInstanceReqs;
            var type = fieldDef.value;
            if (_.has(type, 'customFaker')) {
                var isEnabled = _.includes([true, undefined], fieldDef.enable);
                if (!isEnabled) {
                    return;
                }
                customFakerFunc = _.get(customFaker, type.customFaker);
                fieldValue = _.get(instanceReqs.attributes, fieldName);
                subInstanceReqs = null;
                if (_.get(fieldValue, 'model')) {
                    subInstanceReqs = fieldValue;
                    delete instanceReqs.attributes[fieldName];
                    if (instanceReqs.children === undefined) {
                        instanceReqs.children = [];
                    }
                    instanceReqs.children.push(fieldName);
                }
                customFakerCalls.push(
                    customFakerFunc.bind(null, fieldDef, subInstanceReqs, instances, 
                        function (err, value) {
                            if (err) {
                                return cb(err);
                            }
                            _.set(instance, fieldName, value);
                            logger.debug('  %s.%s = %s', modelName,
                                fieldName,
                                value,
                                '');
                            checkForFinalCallback(fieldName);
                        })
                );
            }
        });
        callbackTotal = customFakerCalls.length;
        if (callbackTotal > 0) {
            _.each(customFakerCalls, function (fakerCall) {
                fakerCall();
            });
        } else {
            cb(null, instance);
        }
    }

    function validateInstance(instance, modelName, modelDef) {
        _.forOwn(instance, function (fieldValue, fieldName) {
            var fieldDef;
            var maxLength;
            var newValue;

            if (modelDef) {
                fieldDef = modelDef[fieldName];
            }
            if (fieldDef) {
                maxLength = fieldDef.maxLength;
            }
            if (maxLength && fieldValue && maxLength !== -1 && (fieldValue.length > maxLength)) {
                newValue = fieldValue.slice(0, maxLength);
                logger.warn('trimming down value for %s.%s, "%s" ->  "%s"', modelName, fieldName, fieldValue, newValue);
                instance[fieldName] = newValue;
            }
        });
    }

    return function (instanceReqs, instances, cb) {
        var modelName = instanceReqs.model,
            defForModel = models.getModelDef(instanceReqs.model).fields,
            instance = {},
            fieldValue,
            isEnabled,
            fakerError;

        _.forOwn(defForModel, function (properties, fieldName) {
                // if properties.enable is undefined, assume it is true
                isEnabled = _.includes([true, undefined], properties.enable);
                if (!isEnabled) {
                    return;
                } else if (_.has(properties, 'value')) {
                    var type = _.get(properties, 'value');
                    if (_.has(type, 'fakerFunction')) {
                        //logger.debug('invoking faker function...' + fieldName);
                        try {
                            fieldValue = vm.runInNewContext(type.fakerFunction, sandbox, {displayErrors: false, timeout: 1000});
                            //fieldValue = eval(properties.fakerFunction);
                        }
                        catch (e) {
                            fakerError = new Error('Error while calling faker function for [' + modelName + '.' + fieldName + ']: ' + e.message);
                        }
                        _.set(instance, fieldName, fieldValue);
                    } else if (_.has(type, 'default')) {
                        _.set(instance, fieldName, type.default);
                    } else if (_.has(type, 'pickOne')) {
                        fieldValue = _.sample(type.pickOne);
                        _.set(instance, fieldName, fieldValue);
                    }
                }
            }
        );

        if (fakerError) {
            return cb(fakerError);
        }

        //logger.debug('calling customFakerFunctions:' + instanceReqs.model);

        callCustomFakerFunctions(modelName, defForModel, instance, instanceReqs, instances, function (err, newInstance) {
            if (err) {
                return cb(err);
            }
            _.merge(newInstance, instanceReqs.attributes);
            validateInstance(newInstance, instanceReqs.model, defForModel);

            _.forEach(instanceReqs.children, function (child) {
                instanceReqs.attributes[child] = instance[child];
            });
            delete instanceReqs.children;

            return cb(null, newInstance);
        });
    };
};

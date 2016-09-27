'use strict';

var models = require('./models');
var common = require('./common.js');
var backend = require('./backend').getBackend();
var find = backend.findRecords;

var _ = require('lodash');
var util = require('util');

var logging = require('../lib/logging');
//    logging.config({'level': 'debug'});
var logger = logging.getDefault();

function getFieldDef(modelDef, fieldName) {
    var prefix = 'decrypted_';
    if (_.startsWith(fieldName, prefix)) {
        return modelDef.fields[fieldName.slice(prefix.length)];
    } else {
        return modelDef.fields[fieldName];
    }
}

function isInsertableField(modelDef, modelName, fieldName) {
    //TODO: think more about how to flag fields that can't be specified without breaking SQL Server insert
    var troublesomeFields = [ 'model_name.field_name'
        , 'businesses.classification' // fails on null insert despite 0 being passed
        , 'collections_incidents.resolved_date' // missing from override?
    ];
    var fieldDef = getFieldDef(modelDef, fieldName);
    if (fieldDef.type === 'timestamp') return false;
    if (fieldDef.isIdentity) return false;
    if (_.indexOf(troublesomeFields, modelName + '.' + fieldName) > -1) return false;
    return true;        
}

function causesCircularDependency(modelDef, modelName, fieldName) {
    var circularFkReferences = [ 'model_name.field_name' 
        , 'businesses.main_address_id'
        , 'businesses.default_billing_bank_account_id'
        , 'businesses.default_disbursement_bank_account_id'
        , 'business_units.user_account_id'
        , 'divisions.vp_user_account_id'
        , 'regions.vp_user_account_id'
        , 'branches.manager_user_account_id'
        , 'branches.risk_account_manager_user_account_id'
        , 'branches.sales_account_manager_user_account_id'
    ];
    var isCircular = (_.indexOf(circularFkReferences, modelName + '.' + fieldName) > -1);
    return isCircular;
}

function quotedValue(value) {
    var qv;
    if (_.isBoolean(value) || _.isNull(value) || _.isFinite(value)) {
        qv = value;
    } else if (_.isDate(value)) {
        qv = "'" + value.toISOString() + "'";
    } else {
        qv = "'" + value.toString()
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'") 
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            + "'";
    }
    return qv;
}

function generateNitroCalls(nitroResults, resultToWrite, fixupUpdateQueries) {
    var instanceReq = resultToWrite.__query;
    var modelDef = models.getModelDef(instanceReq.model);
    var modelPrettyName = modelDef.prettyName;
    var index = _.findIndex(_.get(nitroResults, instanceReq.model), function (resultFromArray) {
        return areResultsFoundByEquivalentQuery(resultToWrite, resultFromArray);
    });
    var specName = util.format('%s%sSpec', modelPrettyName, index);
    var jsText = util.format('var %s = nitro.models.%s()', specName, modelPrettyName);
    _.forOwn(_.omit(resultToWrite, ['__query']), function(value, fieldName) {
        var fieldDef = getFieldDef(modelDef, fieldName);
        var fieldPrettyName = !fieldDef ? 'unknown' : fieldDef.prettyName;
        var withName = 'with' + fieldPrettyName[0].toUpperCase() + (fieldPrettyName.length > 1 ? fieldPrettyName.substr(1) : '');
        if (fieldDef && causesCircularDependency(modelDef, instanceReq.model, fieldName)) {
            if (value !== null) {
                var updateSpecText = util.format('nitro.models.%s().%s(%s)', modelPrettyName, withName, quotedValue(value));
                var updateWhereText = '"id = \'' + resultToWrite.id + '\'"';
                fixupUpdateQueries.push({ "updateSpec": updateSpecText, "updateWhere": updateWhereText });
            }
            withName = '// fix up circular dependency - .' + withName;
        } else if (fieldDef && isInsertableField(modelDef, instanceReq.model, fieldName)) {
            withName = '.' + withName;
        } else {
            withName = '//.' + withName;
        }
        
        jsText += util.format('\n    %s(%s)', withName, quotedValue(value));
    });

    jsText += util.format(';\nspecList.push(%s);', specName);
    return jsText;
}

function reformatIntoCreateOrder(nitroResults) {
    var resultArray = [];
    _.forOwn(nitroResults, function (resultsForModel) {
       resultArray = _.union(resultArray, resultsForModel); 
    });
    return _.sortBy(resultArray, function(result) {
        return result.__query 
            ? util.format('%s%s%s', _.padStart(result.__query.dependencySearchDepthRemaining.toString(), 4, '0'), result.__query.model, result.id) : 
            util.format('XXXX%s', result.id);
    });
}

function areEquivalentQueries(query1, query2) {
    return ((query1.model === query2.model) 
        && _.isEqual(query1.attributes, query2.attributes));
}

function areResultsFoundByEquivalentQuery(result1, result2) {
    if (!result1.__query || !result2.__query) return false;
    return areEquivalentQueries(result1.__query, result2.__query);
}

function resultFromEquivalentQuery(nitroResults, query) {
    return _.find(nitroResults[query.model], function (result) {
       return areEquivalentQueries(result.__query, query); 
    });
}

function appendDependencyQueries(pendingQueriesList, nitroResults, instanceReq, queryDepth) {
    var modelDef = models.getModelDef(instanceReq.model);
    var nitroResult = resultFromEquivalentQuery(nitroResults, instanceReq);
    
    // make a list of foreign-key fields with a value specified in the result
    var fkFields = _.filter(modelDef.fields, function(fieldDef, key) {
       if (_.has(fieldDef, 'targetTable')) {
           fieldDef._fkValue = !nitroResult ? null : nitroResult[key];
           return (fieldDef._fkValue !== null);
       } 
    });
    
    // make nitro.find query parameters to find results at the foreign key's queryDepth 
    var fkQueries = _.map(fkFields, function(fieldDef) {
        var queryDef = {};
        queryDef.model = fieldDef.targetTable;
        queryDef.count = 1;
        queryDef.dependencySearchDepthRemaining = queryDepth;
        queryDef.attributes = {};
        _.set(queryDef.attributes, fieldDef.targetColumn, fieldDef._fkValue);
        return queryDef;
    });

    // add the foreign-key queries (and fix up what we already had) as appropriate 
    _.forEach(fkQueries, function (fkQuery) {
        // some of the queries are equivalent to a query already on the list
        // fix up the already-listed query to note that its result is also needed at this queryDepth 
        var alreadyListedEquivalentQuery = _.find(pendingQueriesList, function (listedQuery) {
            return areEquivalentQueries(listedQuery, fkQuery);
        });
        if (alreadyListedEquivalentQuery) {
            alreadyListedEquivalentQuery.dependencySearchDepthRemaining = queryDepth;
        } else {
            // some of the queries would return a result equivalent to a result already found
            // fix up the already-found result to note that it is needed before queries at this queryDepth
            var alreadyFoundEquivalentResult = resultFromEquivalentQuery(nitroResults, fkQuery);
            if (alreadyFoundEquivalentResult) {
                var fudgeFactor = (fkQuery.model === 'businesses' && instanceReq.model === 'business_contacts') ? 1 : 0;
                if (alreadyFoundEquivalentResult.__query.dependencySearchDepthRemaining > (queryDepth-fudgeFactor)) {
                    alreadyFoundEquivalentResult.__query.dependencySearchDepthRemaining = queryDepth - fudgeFactor; 
                }
            } else {
                // we're not planning to do the query already, and we've not done the query already
                //so put the query at the end of the list 
                pendingQueriesList.push(fkQuery);
            }
        }
    });
}

function findResultAndDependencies(results, instanceReqsList, cb) {
    if (instanceReqsList.length <= 0) {
        cb(null, results);
    } else {
        var instanceReq = _.cloneDeep(instanceReqsList[0]);
        var searchDepthRemaining = instanceReq.dependencySearchDepthRemaining || 0; 
        find(instanceReq, function depthFind (err, result) {
            if (err) {
                if (_.isString(err.cause) && err.cause.indexOf('No records found') > -1) {
                    cb(null, {});
                } else {
                    cb(err);
                }
            } else {
                common.merge(results, result);
                _.forOwn(result, function(resultArray) {
                    _.forEach(resultArray, function(individualResult) {
                        if (!individualResult.__query) {
                            individualResult.__query = _.cloneDeep(instanceReq);
                        }
                    });
                });

                var pendingQueriesList = _.tail(instanceReqsList);
                if (searchDepthRemaining > 0) {
                    appendDependencyQueries(pendingQueriesList, results, instanceReq, searchDepthRemaining - 1);
                }
                logger.debug('findResultAndDependencies found %s id = %s with searchDepthRemaining %s, updated pendingQueriesList length now = %s'
                    , instanceReq.model
                    , !_.toPairs(result)[0] ? null : _.toPairs(result)[0][1][0].id
                    , searchDepthRemaining
                    , pendingQueriesList.length
                );
                findResultAndDependencies(results, pendingQueriesList, function findDependencies(err, dependencyResult) {
                    common.merge(result, dependencyResult);
                    cb(null, result);
                });
            }
        });
    }    
}

function extractAsCreate(instanceReqs, cb) {
    if (!instanceReqs.dependencySearchDepthRemaining) {
        instanceReqs.dependencySearchDepthRemaining = 0;
    }
    
    findResultAndDependencies({}, [instanceReqs], function (err, nitroResults) {
        if (!err) {
            var stmt = "\n\n'use strict';\n\nvar nitro = require('nitro-client');\nvar specList = [];\n\n";
            var resultsToWrite = reformatIntoCreateOrder(nitroResults);
            var fixupUpdateQueries = [];
            _.forEach(resultsToWrite, function (resultToWrite) {
                stmt += '\n\n// query criteria: ' + JSON.stringify(resultToWrite.__query) + '\n';
                stmt += generateNitroCalls(nitroResults, resultToWrite, fixupUpdateQueries);
            });
            if (fixupUpdateQueries.length > 0) {
                stmt += '\n\n';
                _.forEach(fixupUpdateQueries, function(fixup) {
                stmt += util.format('\nspecList.push({ "updateSpec": %s, "updateWhere": %s});'
                        , fixup.updateSpec
                        , fixup.updateWhere
                ); 
                });
            }
            stmt += "\n\n" + 
                "// perform nitro calls for all specs in specList, summarize results, and report errors\n" +
                "var allResults = {};\n" +
                "var createCount = 0, updateCount = 0, successCount = 0, errorCount = 0;\n" +
                "function collectNitroResults(spec) {\n" +
                "    if (spec.hasOwnProperty('updateWhere')) {\n" +
                "        updateCount++;\n" +
                "        return nitro.updateAsync(spec.updateSpec, spec.updateWhere)\n" +
                "        .then(function (result) {\n" +
                "            successCount++;\n" +
                "            nitro.merge(allResults, result);\n" +
                "            return result;\n" +
                "        })\n" +
                "        .catch(function (err) {\n" +
                "            errorCount++;\n" +
                "            return { 'error': err.cause.toString(), 'spec': spec };\n" +
                "        });\n" +
                "    } else {\n" +
                "        createCount++;\n" +
                "        return nitro.createAsync(spec)\n" +
                "        .then(function (result) {\n" +
                "            successCount++;\n" +
                "            nitro.merge(allResults, result);\n" +
                "            return result;\n" +
                "        })\n" +
                "        .catch(function (err) {\n" +
                "            errorCount++;\n" +
                "            return { 'error': err.cause.toString(), 'spec': spec };\n" +
                "        });\n" +
                "    }\n" +
                "}\n" +
                "nitro.Promise.mapSeries(specList, collectNitroResults)\n" +
                ".then(function (createResults) {\n" + 
                "    console.log('Creates completed: %s, updates completed: %s, successes: %s, errors: %s', createCount, updateCount, successCount, errorCount);\n" +
                "    createResults.forEach(function (result) {\n" +
                "       if (result.hasOwnProperty('spec') && result.hasOwnProperty('error')) {\n" +
                "           console.log(JSON.stringify(result, null, 4));\n" +
                "       }\n" +
                "   });\n" +
                "   //console.log(JSON.stringify(createResults, null, 4));\n" +
                "})";
            cb(null, stmt);
        } else {
            cb(err);
        }
    });
}

module.exports = extractAsCreate;

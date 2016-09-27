var Promise = require('bluebird');
var retry = require('bluebird-retry');
var _ = require('lodash');
var connector = require('./connector');

function getModelNameFromURI(uri) {
    // ".../alps/problemGroups#problemGroup-representation" -> problemGroups
    return uri.split('#')[0].split('/').pop()   
}

function getSingularModelNameFromURI(uri) {
    // ".../alps/problemGroups#problemGroup-representation" -> problemGroup
    return uri.split('#')[1].split('-')[0];
}

function ECONNRESET(e) { return e.code === 'ECONNRESET'; }

module.exports = function(cb) {
    var models = {};
    connector.getModelsAsync()
        .then(function (models) {
            //  Fire off a a couple requests for every model to get schema information.
            //  A high number of simultaneous connections tends to cause ECONNRESET's from servers,
            //  We retry each request that fails a few times and then give up.
            return Promise.map(models, function (modelInfo) {
                return retry(connector.getSchemaAsync.bind(null, modelInfo), { interval:100, max_interval:1000, backoff:1.5 });
            }).catch(function(err) {
                console.log("failed to download schema information");
                console.log(err);
                process.exit(1);
            });
        })
        .tap(function (schemas) {
            //console.log(JSON.stringify(schemas, null, 4));
        })
        .then(function (modelsInfo) {
            var modelDefs = {};

            _.forEach(modelsInfo, function(modelInfo) {
                var modelDef = {'fields': {}};

                modelDef.prettyName = modelInfo.singularName;
                modelDef.url = modelInfo.url;
                modelDef.fields.id = {
					"enable": false,
					"prettyName": "id",
					"type": "uuid",
					"value": {
						"default": "00000000-0000-0000-0000-000000000000"
					}
				};

                _.forEach(modelInfo.schema, function(fieldInfo, fieldName) {
                    // fieldInfo - schema data from api
                    // fieldDef - our representation (models.json)
                    fieldDef = {};
                    fieldDef.enable = !fieldInfo.readOnly;
                    fieldDef.prettyName = fieldName;
                    switch (fieldInfo.type) {
                        case 'string':
                            fieldDef.type = fieldInfo.format === undefined ? 'string' : 'string:' + fieldInfo.format;
                            break;
                        case 'object':
                            var isDate = _.includes(fieldName, 'Date');
                            fieldDef.type = isDate ? 'object:date' : 'object';
                            break;
                        default:
                            fieldDef.type = fieldInfo.type;
                    }

                    switch (fieldDef.type) {
                        case 'string':
                            fieldDef.value = { 'default': '??' };
                            break;
                        case 'string:uri':
                            fieldDef.value = { 'customFaker': 'foreignKey.random' };
                            break;
                        case 'string:date-time':
                            fieldDef.value = { 'fakerFunction': 'faker.date.past()' };
                            break;
                        case 'object:date':
                            fieldDef.value = { 'fakerFunction': 'faker.date.past()' };
                            break;
                        case 'integer':
                            fieldDef.value = { 'fakerFunction': 'faker.random.number()' };
                            break;
                        case 'number':
                            fieldDef.value = { 'fakerFunction': 'faker.random.number()' };
                            break;
                        case 'boolean':
                            fieldDef.value = { 'fakerFunction': 'faker.random.boolean()' };
                            break;
                        case undefined:
                            fieldDef.value = { 'default': 'something_undefined' }; // FIXME
                            console.log('WARNING:  ' + modelDef.prettyName + '.' + fieldDef.prettyName + ' has a type of undefined !!??');
                            break;
                        case 'object':
                            fieldDef.value = { 'default': 'something_object' };  // FIXME
                            break;
                        case 'array':
                            fieldDef.value = { 'default': 'something_array' }; // FIXME
                            break;
                        default:
                            throw Error('unknown type: ' + JSON.stringify(fieldDef.type));
                    }

                    modelDef.fields[fieldName] = fieldDef;
                });

                _.forEach(modelInfo.representation.descriptors, function(fieldInfo) {
                    if (fieldInfo.rt) {
                        var fieldDef = modelDef.fields[fieldInfo.name];
                        fieldDef.targetTable = getModelNameFromURI(fieldInfo.rt);
                        fieldDef.prettyTargetTable = getSingularModelNameFromURI(fieldInfo.rt) + 'Model';
                        fieldDef.targetColumn = 'id'; //FIXME  should this be configuration?
                    }
                });
                modelDefs[modelInfo.model] = modelDef;
            });
            // strip out 'reverse' foreign keys (SMAL-95)
            // e.g. notaries shouldn't exist on userAccounts
            var modelNames = Object.keys(modelDefs);
            _.forEach(modelDefs, function(modelDef, modelName) {
                _.forEach(modelDef.fields, function(fieldDef, fieldName) {
                    if ( fieldDef.type === 'string:uri' &&
                       _.includes(modelNames, fieldName ) ) {
                           // console.log('deleting ' + modelName + '.' + fieldName);
                           delete modelDefs[modelName].fields[fieldName];
                    }
                });
            });
            return modelDefs;
        })
        .then(function (models) {
            cb(null, models);
        })
        .catch(cb);
};

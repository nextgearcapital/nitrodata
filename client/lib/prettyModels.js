var _ = require('lodash');

function getPrettyModels() {
    var modelDefs = _.cloneDeep(require('../generated/models.json'));
    prettyModels = {}

    //prettify model keys...
    _.forEach(modelDefs, function (modelDef, modelName) {
        var prettyModelFields = {};

        //prettify field keys...
        _.forEach(modelDef.fields, function(fieldDef, fieldName) {
            prettyModelFields[fieldDef.prettyName] = fieldDef;
            fieldDef.dbName = fieldName;
        });

        //start with original modelDef
        prettyModels[modelDef.prettyName] = modelDef;
        //overwrite dbname fields with prettyName fields
        prettyModels[modelDef.prettyName].fields = prettyModelFields;
        //add original dbName
        prettyModels[modelDef.prettyName].dbName = modelName;
    });

    return prettyModels;
}

module.exports = {
    getPrettyModels: getPrettyModels
};

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    config = require('../config'),
    logger = require('./logging').getDefault(),
    models = {},
    overrides = {};


// customizer for lodash's merge, we need to clobber the value {} entirely, instead of merging
// see SMAL-19 for rational
function _overrideValue(def, override, key, object, source) {
    if (key === 'value') {
        return override;
    }
}

function getModelDef(modelName, _options) {
    // deep clone of model, consumers of this module can't dirty our data
    var clonedModelDef,
        clonedOverride,
        options;

    _options = _options || {};
    options = {
        withOverrides: _.has(_options, 'withOverrides') ? _options.withOverrides : true
    };

    clonedModelDef = _.cloneDeep(models[modelName]);
    if (options.withOverrides) {
        clonedOverride = _.cloneDeep(overrides[modelName]);
        clonedModelDef = _.mergeWith(clonedModelDef, clonedOverride, _overrideValue);
    }
    return clonedModelDef;
}

function getModelOverrides(modelName) {
    return _.cloneDeep(overrides[modelName]);
}

function getAllModelOverrides() {
    return _.cloneDeep(overrides);
}

function getAllModelDefs(_options) {
    // deep clone of model, consumers of this module can't dirty our data
    var clonedModelDef,
        clonedOverride,
        options;

    _options = _options || {};
    options = {
        withOverrides: _.has(_options, 'withOverrides') ? _options.withOverrides : true
    };


    clonedModelDef = _.cloneDeep(models);
    if (options.withOverrides) {
        clonedOverride = _.cloneDeep(overrides);
        clonedModelDef = _.mergeWith(clonedModelDef, clonedOverride, _overrideValue);

    }
    return clonedModelDef;
}

function clobberModels(newModels) {
    models = newModels;
}

function clobberOverrides(newOverrides) {
    overrides = newOverrides;
}

function loadOverrides(cb) {
    if (!config.model_overrides) {
        // overrides are disabled by setting config.model_overrides to false-y
        return cb(null, {})
    }
    var overrideIsAbsolute = path.isAbsolute(config.model_overrides); // jshint ignore:line
    var directoryPath = overrideIsAbsolute ? config.model_overrides : path.join(__dirname, '../..', config.model_overrides);  // jshint ignore:line
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            if (_.includes(err.toString(), 'ENOENT') ||
                _.includes(err.toString(), 'ENOTDIR')) {
                logger.warn('Could not find overrides at: "%s"', directoryPath);
                return cb(null, {});
            } else {
                return cb(err);
            }
        }

        // filter out non .json files
        files = _.filter(files, function(filename) {
            return (filename.slice(-5) === '.json')
        });

        if (!files.length) {
            cb(null, {});
        }

        var overrides = {};
        var callbackCounter = 0;
        var fileCount = files.length;
        logger.info('getting ready to load %d override files', fileCount);
        _.forEach(files, function(filename) {
            var filePath = path.join(directoryPath, filename);
            fs.readFile(filePath, function (err, fileContents) {
                if (err) {
                    logger.warn('Error trying to read: "%s"', filePath, err);
                    return cb(err);
                }
                var modelName = filename.slice(0, -5);
                if ( models.hasOwnProperty(modelName) ) {
                    overrides[modelName] = JSON.parse(fileContents);
                } else {
                    logger.warn("Refusing to load override from '%s', model named '%s' doesn't exist", filename, modelName);
                }
                callbackCounter++;
                if (callbackCounter === fileCount) {
                    return cb(null, overrides);
                }
            });
        });
    });
}

function loadFromBackend(backend, cb) {
    backend.generateAllModels(function (err, _models) {
        if (err) {
            return cb(err);
        }
        models = _models;
        loadOverrides( function (err, _overrides) {
            if (err) {
                return cb(err);
            }
            overrides = _overrides;
            logger.info('loaded %d models from database', _.keys(models).length);
            cb();
        });
    });
}

function getAllModelDefsWithMeta(_options) {
    var modelDefs = getAllModelDefs(_options),
        namespaces = [];

    if ( config.default_namespace !== 'disabled' ) {
        namespaces = _.map(modelDefs, function(modelDef, modelName) { return modelName.split('.')[0] });
        namespaces = _.uniq(namespaces);
    }

    return {
        models: modelDefs,
        meta: {
            namespaces: namespaces,
            defaultNamespace: config.default_namespace
        }
    };
}

module.exports = {
    getModelDef: getModelDef,
    getAllModelDefs: getAllModelDefs,
    getAllModelDefsWithMeta: getAllModelDefsWithMeta,
    getModelOverrides: getModelOverrides,
    getAllModelOverrides: getAllModelOverrides,
    clobberModels: clobberModels,
    clobberOverrides: clobberOverrides,
    loadFromBackend: loadFromBackend
};

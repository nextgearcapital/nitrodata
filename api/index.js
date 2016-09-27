"use strict";
process.chdir(__dirname);

require('./lib/initSwig');
var config = require('./config'),
    logging = require('./lib/logging'),
    logger,
    models,
    backend;

// logging needs to be set up before the other modules load
logging.config(config.logging);
logger = logging.getDefault();

backend = require('./lib/backend').getBackend();
models = require('./lib/models');

logger.info('config', config);

var initialized = false;
function init(cb) {
    backend.init(config.backend , function(err, result) {
        logger.info('connected to db');
        models.loadFromBackend(backend, function(err) {
            if (err) { return cb(err); }
            logger.info('finished initializing');
            initialized = true;
            return cb();
        });
    });
}

function create(model, cb) {
    var fakeFindOrInsert = require('./lib/fake_and_insert');
    var instances = {};
    var instanceReqs = model.getData();
    function callFakeFindOrInsert() {
        fakeFindOrInsert(instanceReqs, instances, function (err, records) {
            if (err) { return cb(err); }
            cb(null, instances);
        });
    }

    if (!initialized) {
        console.log('not initialized yet, initializing...');
        init(callFakeFindOrInsert);
    } else {
        console.log('already initialized, skipping...');
        callFakeFindOrInsert();
    }
}

module.exports = {
    init: init,
    create: create
};

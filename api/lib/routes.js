var _ = require('lodash'),
    express = require('express'),
    router = express.Router(),
    swig = require('swig'),
    path = require('path'),
    fakeFindOrInsert = require('./fake_and_insert'),
    extractAsCreate = require('./extract_as_create'),
    prettify = require('./common').prettifyAccumulator,
    accumulate = require('./common').accumulate,
    logger = require('./logging').getDefault(),
    backend = require('./backend').getBackend(),
    config = require('../config'),
    models = require('./models');


router.get('/client.tar', function (req, res) {
    var createClient = require('./create_client');

    res.set('Content-Type', 'application/x-tar');
    createClient.getTarBallStream().pipe(res);
});

router.post('/createRecords', function (req, res) {
    var instanceReqs = req.body;
    var instances = {}; //this def is required here to be outside all iterative looping
    logger.info('/createRecords received:', instanceReqs);

    fakeFindOrInsert(instanceReqs, instances, function (err, records) {
        if (!err) {
            res.json( prettify(instances, models) );
        } else {
            logger.error(err);
            res.status(500);
            return res.send(err.message);
        }
    });
});

router.post('/updateRecords', function (req, res) {
    var instanceReqs = req.body;
    var modelName = instanceReqs.model;

    logger.info('/updateRecords received:', instanceReqs);

    backend.updateRecords(instanceReqs, models, function (err, records) {
        if (!err) {
            var recordsToReturn = {};
            accumulate(recordsToReturn, records, modelName);
            res.json( prettify(recordsToReturn, models) );
        } else {
            logger.error(err);
            res.status(500);
            return res.send(err.message);
        }
    });
});

router.post('/deleteRecords', function (req, res) {
    var instanceReqs = req.body;
    backend.deleteRecords(instanceReqs, models, function (err, record) {
        if (!err) {
            return res.json('record: deleted');
        } else {
            logger.error(err);
            return res.sendStatus(500);
        }
    });
});

router.get('/findRecords', function (req, res) {
    var instanceReqs = req.body;
    var modelName = instanceReqs.model
    logger.info('/findRecords received:', instanceReqs);
    backend.findRecords(instanceReqs, models, function (err, records) {
        if (!err) {
            var recordsToReturn = {};
            accumulate(recordsToReturn, records, modelName);
            if ( recordsToReturn && !_.isEmpty(recordsToReturn) ) {
                return res.json( prettify(recordsToReturn, models) );
            }
            else {
                res.status(404);
                return res.send('No records found matching criteria.');
            }
        } else {
            logger.error(err);
            res.status(500);
            return res.send(err.message);
        }
    });
});

router.get('/extractAsCreate', function (req, res) {
    var instanceReqs = req.body;
    extractAsCreate(instanceReqs, function (err, jsCode) {
        if (!err) {
            if (jsCode) {
                return res.json(jsCode);
            }
            else {
                res.status(404);
                return res.send('No records found matching criteria.');
            }
        } else {
            logger.error(err);
            res.status(500);
            return res.send(err.message);
        }
    });
});

router.get('/models.json', function (req, res) {
    models.loadFromBackend(backend, function(err) {
        if (err) {
            logger.error(err);
            res.status(500);
            return res.send(err.message);
        }
        res.json(models.getAllModelDefsWithMeta());
    });
});

router.get('/models', function (req, res) {
    var context = {
        models: models.getAllModelDefs()
    };
    var html = swig.renderFile(path.join(__dirname, 'templates', 'allModels.html.swig'), context);
    res.send(html);
});

router.get('/', function (req, res) {
    var context = {
        dbConnConfig: config.backend
    };
    var html = swig.renderFile(path.join(__dirname, 'templates', 'index.html.swig'), context);
    res.send(html);
});

router.param('modelName', function(req, res, next, modelName) {
    req.model = models.getModelDef(modelName);
    req.modelName = modelName;
    next();
});

router.get('/models/:modelName', function (req, res) {
    var dataGenerator = require('./data_generator')(models);
    var instanceReqs = {
        model: req.modelName,
        attributes: {}
    };
    var instances = { top: {}, all: {} }; //this def is required here to be outside all iterative looping
    dataGenerator(instanceReqs, instances, function(err, instance) {
        var context = {
            modelDef: req.model,
            modelName: req.modelName,
            instance: instance,
            instanceJSON: JSON.stringify(instance, null, 4),
            useNamespaces: config.default_namespace != 'disabled'
        };
        var html = swig.renderFile(path.join(__dirname, 'templates', 'model.html.swig'), context);
        res.send(html);
    });

});

router.get('/angularModels/:modelName', function (req, res) {
    var dataGenerator = require('./data_generator')(models);
    var instanceReqs = {
        model: req.modelName,
        attributes: {}
    };
    var instances = { top: {}, all: {} }; //this def is required here to be outside all iterative looping
    dataGenerator(instanceReqs, instances, function(err, instance) {
        var context = {
            modelDef: req.model,
            instance: instance
        };
        var html = swig.renderFile(path.join(__dirname, 'templates', 'new_model.html.swig'), context);
        res.send(html);
    });

});

module.exports = router;

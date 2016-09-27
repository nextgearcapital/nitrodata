#! /usr/bin/env node
"use strict";

process.chdir(__dirname);

require('./lib/initSwig');
var backoff = require('backoff'),
    config = require('./config'),
    logging = require('./lib/logging'),
    appFactory = require('./lib/express_app'),
    logger,
    models,
    backend,
    host,
    port,
    server;

// logging needs to be set up before the other modules load
logging.config(config.logging);
logger = logging.getDefault();

backend = require('./lib/backend').getBackend();
models = require('./lib/models')

logger.info('config', config);

var call = backoff.call(backend.init, config.backend , function(err, result) {
    models.loadFromBackend(backend, function(err) {
        if (err) { throw err; }
        var app = appFactory();
        server = app.listen(config.port, config.host, function () {
            host = server.address().address;
            port = server.address().port;
            logger.info('Listening at http://%s:%s', host, port);
        });
    });

});

call.setStrategy(new backoff.FibonacciStrategy({
    initialDelay: 100,
    maxDelay: 2000
}));
call.on('backoff', function (number, delay) {
    logger.info('retrying...');
});
call.start();

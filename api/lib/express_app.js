"use strict";

var express = require('express'),
    bodyParser = require('body-parser');

function getExpressApp() {
    var app = express();

    app.use(bodyParser.json());
    app.use(require('./routes'));
    return app;
}

module.exports = getExpressApp;

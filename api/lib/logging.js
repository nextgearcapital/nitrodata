'use strict';

var winston = require('winston'),
    moment = require('moment'),
    defaultConfig = {level: 'error'},
    defaultLogger;


module.exports = {
    config: function (config) {
        defaultLogger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({
                    colorize: true,
                    level: config.level,
                    label: '',
                    prettyPrint: true,
                    timestamp: function() { return moment().format('YYYY-MM-DD HH:mm:ss Z'); },
                    stderrLevels: []
                }),
                new (winston.transports.File)({
                    filename: 'nitro.json.log',
                    level: config.level,
                    json: true
                })
            ]
        });
        defaultLogger.info('configuring logger', config);
    },

    getDefault: function () {
        if (defaultLogger === undefined) {
            this.config(defaultConfig);
        }
        return defaultLogger;
    }
};

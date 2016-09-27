'use strict';

var fs = require('fs');
var path = require('path');
//var _ = require('lodash');
var should = require('chai').should(); // jshint ignore:line
var generate = require('../lib/generate');

var pathToModels = path.join(__dirname, '../generated/models.js')
var removeModels = function (cb) {
    fs.unlink(pathToModels, function(err) {
        cb();  //whether error or success, keep going
    });
};
var readModels = fs.readFile.bind(null, pathToModels, 'utf-8');
var fakeModels = {
    'models': {
        'dbo.business_locks': {
            'prettyName': 'businessLock',
            'namespace': 'dbo',
            'fields': {
                'business_id': {
                    'customFaker': 'foreignKey.random',
                    'targetTable': 'businesses',
                    'targetColumn': 'id'
                }
            }
        },
        'dbo.businesses': {
            'prettyName': 'business',
            'namespace': 'dbo',
            'fields': {}
        }
    },
    'meta': {
        namespaces: [
            "dbo",
            "Salesforce"
        ],
        defaultNamespace: "dbo"
    }
};

describe('generate.js', function () {

    before(function (done) {
        removeModels(done);
    });

    it('.models() should return the client model code with a constructor function', function (done) {

        generate.modelsCode(fakeModels, function(err, results) {
            if (err) done(err);
            readModels(function(err, modelData) {
                if (err) done(err);
                modelData.should.include('function dbo___businessLock (attributes)');
                done();
            });
        });
    });
});

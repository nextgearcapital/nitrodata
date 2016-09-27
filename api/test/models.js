'use strict';

//require('../lib/logging').config({level: 'debug'});

var should = require('chai').should(); // jshint ignore:line

describe('Model Definitions', function() {
    var models = require('../lib/models');
    describe('models', function (done) {
        before(function (done) {
            models.clobberModels({
                'aModel': {
                    'fields': {
                        'name': {
                            value: { 'default': 'Bob' }
                        }
                    }
                },
                'bModel': {
                    'fields': {
                        'grok': {
                            value: { 'default': null }
                        }
                    }
                }
            });
            models.clobberOverrides({
                'aModel': {
                    'fields': {
                        'name': {
                            value: { 'fakerFunction': 'faker.fakeSomething()' }
                        }
                    },
                    "display": "id: {{id}}"
                }
            });
            done();
        });

        it('getModelDef(modelName) should return the model definition with override', function (done) {
            var model = models.getModelDef('aModel');
			should.not.exist(model.fields.name.value.default);
            model.fields.name.value.fakerFunction.should.equal('faker.fakeSomething()');
            done();
        });
        it('getModelDef(modelName, {withOverrides: false}) should return the model definition without override', function (done) {
            var model = models.getModelDef('aModel', { withOverrides: false });
            model.fields.name.value.default.should.equal('Bob');
            done();
        });
        it('getAllModelDefs(modelName) should return all model definitions with override', function (done) {
            var all = models.getAllModelDefs('aModel');
			should.not.exist(all.aModel.fields.name.value.default);
            all.aModel.fields.name.value.fakerFunction.should.equal('faker.fakeSomething()');
            done();

            (all.bModel.fields.grok.value.default === null).should.equal(true);
        });
        it('getAllModelDefs(modelName, {withOverrides: false}) should return all model definitions without override', function (done) {
            var all = models.getAllModelDefs({ withOverrides: false });
            all.aModel.fields.name.value.default.should.equal('Bob');
            (all.bModel.fields.grok.value.default === null).should.equal(true);
            done();
        });
        it('getModelOverrides(modelName) should return the overrides for that model', function (done) {
            var overrides = models.getModelOverrides('aModel');
            overrides.fields.name.value.fakerFunction.should.equal('faker.fakeSomething()');
            overrides.display.should.equal("id: {{id}}");
            done();
        });
        it('getAllModelOverrides() should return the overrides for that model', function (done) {
            var overrides = models.getAllModelOverrides();
            overrides.aModel.fields.name.value.fakerFunction.should.equal('faker.fakeSomething()');
            overrides.aModel.display.should.equal('id: {{id}}');
            done();
        });

    });
});

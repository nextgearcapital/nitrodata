'use strict';


var should = require('chai').should(); // jshint ignore:line

describe('dataGenerator-', function() {
    //require('../lib/logging').config({'level': 'debug'});
    var modelsMocker = require('./misc/modelsMocker');
    describe('customFakerFunction', function () {
        before(function () {
        });

        it('phone() should be ten digits without any non integer characters', function (done) {
            var tenDigitRegex = /^\d{10}$/;
            var models = modelsMocker({
                'a_model': {
                    'fields': {
                        'phone': {
                            'value':
                                {'customFaker': 'phone'}
                        }
                    }
                }
            });
            var dataGenerator = require('../lib/data_generator')(models);

            var instanceReqs = {
                'model': 'a_model',
                'attributes': {}
            };
            var instances = {};

            dataGenerator(instanceReqs, instances, function(err, instance) {
                instance.phone.should.match(tenDigitRegex);
                done();
            });

        });

        after(function () {
        });
    });
    describe('validation', function () {
        before(function () {
        });

        it('should trim down fields that are longer than maxLength', function (done) {
            var models = modelsMocker({
                'a_model': {
                    'fields': {
                        'name': {
                            value: { 'default': 'SuperCaliFragilisticExpealidocious' },
                            'maxLength': 9
                        }
                    }
                }
            });
            var dataGenerator = require('../lib/data_generator')(models);

            var instanceReqs = {
                'model': 'a_model',
                'attributes': {}
            };

            dataGenerator(instanceReqs, {}, function(err, instance) {
                instance.name.should.equal('SuperCali');
                done();
            });

        });

        after(function () {
        });
    });
});

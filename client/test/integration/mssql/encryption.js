'use strict';

var should = require('chai').should(); // jshint ignore:line
var nitro = require('../../../client.js');
var uuid4 = require('uuid4');

//require('../lib/logging').config({'level': 'debug'});


describe('create' , function() {
    describe('Person.Person', function () {
        before(function () {
        });

        it('should return a Person with an encrypted ssn', function (done) {
            var m = nitro.nsModels;

            var businessEntityModel = m.Person.BusinessEntity()
                                        .createNew();

            var personModel = m.Person.Person()
                .withFirstName('Nancy')
                .withLastName('Drew')
                .withSsn('345678901')
                .withEmailPromotion(0)
                .withBusinessEntity(businessEntityModel)
                .createNew();

            nitro.create(personModel, function (err, results) {
                if (err) {
                    done(err);
                } else {
                    console.log('results:', results);
                    results.Person[0].firstName.should.equal('Nancy');
                    results.Person[0].lastName.should.equal('Drew');


                    done();
                }
            });
        });
    });
});


'use strict';

var should = require('chai').should(); // jshint ignore:line
var nitro = require('../../../client.js');
var m = nitro.nsModels;
var uuid4 = require('uuid4');
var _ = require('lodash');

var uuid = uuid4().toUpperCase();
//require('../lib/logging').config({'level': 'debug'});

describe('find and update', function() {
    describe('', function () {
        before(function (done) {
            var addressModel = m.Person.Address()
                .withAddressLine1('123 Evergreen Terrace')
                .withCity('Springfield')

            nitro.createAsync(addressModel)
                .then(function (results) {
                    done()
                })
                .catch(done);
        });

        it("/findRecords should return an address that matches '123 Evergreen Terrace'", function (done) {
            var addressSearchModel = m.Person.Address()
                .withAddressLine1('123 Evergreen Terrace');

            nitro.findAsync(addressSearchModel)
                .then(function (results) {
                    results.Address[0].addressLine1.should.equal('123 Evergreen Terrace');
                    done();
                })
                .catch(done);
		});

        it('/updateRecords should update an address', function (done) {
            var addressUpdateModel = m.Person.Address()
                .withAddressLine1('743 Evergreen Terrace');

            nitro.updateAsync(addressUpdateModel, "addressLine1='123 Evergreen Terrace'")
                .then(function (results) {
                    results.Address[0].addressLine1.should.equal('743 Evergreen Terrace');
                    done();
                })
                .catch(done)
		});

	});
});


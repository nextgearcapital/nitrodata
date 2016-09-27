'use strict';

var should = require('chai').should(); // jshint ignore:line
var nitro = require('../../../client.js');
var uuid4 = require('uuid4');

//require('../lib/logging').config({'level': 'debug'});


describe('create' , function() {
    describe('BusinessEntity (with nested Address and AddressType)', function () {
        before(function () {
        });

        it('should return a BusinessEntityAddress -> Address -> AddressType', function (done) {
            var m = nitro.nsModels;

            var addressTypeModel = m.Person.AddressType()
                .withName('Primary')
                .useExisting();

            var addressModel = m.Person.Address()
                .withAddressLine1('742 Evergreen Terrace')
                .withCity('Springfield')
                .createNew();

            var businessEntityModel = m.Person.BusinessEntity()
                .createNew();

            var businessEntityAddress = m.Person.BusinessEntityAddress()
                .withAddress(addressModel)
                .withAddressType(addressTypeModel)
                .withBusinessEntity(businessEntityModel)
                .createNew();


			nitro.create(businessEntityAddress, function (err, results) {
				if (err) {
					done(err);
				} else {
                    results.AddressType[0].name.should.equal('Primary');
                    results.Address[0].addressLine1.should.equal('742 Evergreen Terrace');
                    results.Address[0].city.should.equal('Springfield');

                    var businessEntityId = results.BusinessEntity[0].businessEntityId;
                    var addressId = results.Address[0].addressId;
                    results.BusinessEntityAddress[0].businessEntityId.should.equal(businessEntityId)
                    results.BusinessEntityAddress[0].addressId.should.equal(addressId)

                    done();
				}
			});
		});
	});
});


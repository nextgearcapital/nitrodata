var faker = require('faker');
var nitro = require('nitro-client');
var f = require('../adventureworks/factories');
var m = nitro.nsModels;

var productModel = f.product.generic()
    .withName(faker.commerce.productName())
    .createNew();

nitro.createAsync(productModel)
    .then(function(results) {
        console.log(results);
    });



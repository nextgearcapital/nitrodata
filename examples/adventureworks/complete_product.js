var nitro = require('nitro-client');
var _ = require('lodash');
var m = nitro.nsModels;
var productMaker = require('../adventureworks/makers/product');


var completeProduct = productMaker();

completeProduct.product.withName('Inflatable Two Man Boat #' + _.random(1, 10000))
completeProduct.subcategory.withName('Boats');
completeProduct.category.withName('Water Transportation')

completeProduct.execAsync()
    .then(function(results) {
        console.log(results);
    });



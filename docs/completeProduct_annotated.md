# An example with comments #

An annotated example of how to create and consume a complete model (aka maker).


```javascript

var nitro = require('nitro-client');

// I like to use the bluebird promise library, nitro exports it as a convenience
var Promise = nitro.Promise;

// m and f are shorthand conventions for models and factories.
var m = nitro.nsModels;
var f = require('../factories');

// 'complete' is used to distinguish between a plain model named Product and this Product Maker.
function completeProduct() {

    // i will be our complete business that this constructor function will return.
    var i = {};
    
    // create a ProductCategory model and attach it to our instance
    i.category = m.Production.ProductCategory();

    // create a ProductSubcategory model and point it at our ProductCategory
    i.subcategory = m.Production.ProductSubcategory()
        .withProductCategory(i.category);

    // create a Product and point it at our ProductSubcategory
    i.product = f.product.generic()
        .withProductSubcategory(i.subcategory);

    // create a ProductInventory and ProductReview model.
    // note that we could call .withProduct(i.product) on these models,
    // however, it is usually preferred to wire up relationships manually,
    // when there are multiple models pointing at the same model.
    i.productInventory = m.Production.ProductInventory();
    i.productReview = m.Production.ProductReview();

    // exec() and execAsync() create all of the models and wires them together.
    i.exec = function(cb) {
        // aggregate all the nitro calls into one results object to return to our caller
        var aggregateResults = {};

        // store the product id in this scope so that it can be shared between our .then functions
        var productId;

        // create the product
        nitro.createAsync(i.product)
            .then(function (results) {

                // store the id of the Product we just created.
                productId = results.Product[0].id;

                // store the results from createAsync(i.product) into our aggregate results object
                nitro.merge(aggregateResults, results);

                // update the ProductInventory model with the Product's id
                i.productInventory.withProductId(productId);

                // create the ProductInventory model.
                return nitro.createAsync(i.productInventory);

            })
            .then(function (results) {

                // store the results from createAsync(i.productInventory) into our aggregate results object
                nitro.merge(aggregateResults, results);

                // update the ProductReview model with the Product's id
                i.productReview.withProductId(productId);

                // create the ProductReview model.
                return nitro.createAsync(i.productReview);

            })
            .then(function (results) {

                // store the results from createAsync(i.productReview) into our aggregate results object
                nitro.merge(aggregateResults, results)

                // exit the exec() function using node style callback
                cb(null, aggregateResults);
            })
            .catch(function (err) {

                // log out error, and exit exec()
                console.log('Error creating completeProduct:', err);
                cb(err);
            })
    }

    // Bluebird can automagically promisify functions that accept node style callbacks
    i.execAsync = Promise.promisify(i.exec);

    // return created object to our caller
    return i;
}

module.exports = completeProduct;
```


Here is how to consume a maker.

```javascript
var productMaker = require('../< path to completeProduct.js >')

// A before block in mocha or jasmine.

// tweak this to work with your testing framework
// call done() after data has been created
function before(done) {
    var completeProduct = productMaker();

    completeProduct.product.withName('Inflatable Two Man Boat #' + _.random(1, 10000))
    completeProduct.subcategory.withName('Boats');
    completeProduct.category.withName('Water Transportation')

    completeProduct.execAsync()
        // nitro.displayResults is a helper function, that will print out
        // the models you just created, you might want to leave this one
        // commented out, and uncomment it when you need to see what's going on
        .then(nitro.displayResults)
        .then(function(results) {
            // you can inspect them, get the uuid of a model, etc.
        })
        .then(done)
}
```

[Back to the intro](intro.md)

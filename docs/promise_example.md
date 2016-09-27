# Promises, Promises #

The problems:

1.  JavaScript's async nature can get out of hand.  Also known as [callback hell](http://callbackhell.com)

2. None of the examples so far have shown us how to get back our return values.


Solution:  (Promises)[https://spring.io/understanding/javascript-promises]

1. Create a model [like we did before](factories.md).

        var f = require('../factories');
        var product1 = f.product.withName('Life Jacket');
        var product2 = m.Production.ProductCategory().withName('Saltine');
        var product3 = m.Production.ProductCategory().withName('Astronaut Ice Cream');

2. Use nitro.createAsync with `.then` and `.catch`

        nitro.createAsync(product1)
            .then( function (results) {
                return nitro.createAsync(product2)
            })
            .then( function (results) {
                return nitro.createAsync(product3);
            })
            .then( function (results) {
                console.log('finished!');
            }
            .catch( function (err) {
                console.log('error making buyers:\n', err);
                // handle error
            });

3. use `nitro.displayResults` and `nitro.merge` to log out the data you just created.

        var results = {}
        nitro.createAsync(product1)
            .then( function (_results) {
                nitro.merge(results, _results);
                return nitro.createAsync(product2)
            })
            .then( function (_results) {
                nitro.merge(results, _results);
                return nitro.createAsync(product3);
            })
            .then( function (_results) ) {
                return nitro.merge(results, _results);
            })
            .then( function() {
                nitro.displayResults(results);
            })
            .catch( function (err) {
                console.log('error making product:\n', err);
                // handle error
            });

4. We succeeded in creating our 3 buyers, but there are a couple issues.  1) Each buyer was created in sequence, when they could be created in parallel.  2) It's a bit wordy

        Promise.map( [product1, product2, product3] )
            .then(nitro.aggregateResultsArray)
            .then ( function ( results ) {
                console.log(results);
            });
            .catch( function (err) {
                console.log('error making buyers:\n', err);
                // handle error
            });

Note that we used the function `nitro.aggregateResultsArray` to aggregate our results.  All buyers were created simultaneously.  Also note how the value from one `.then` function is returned to the next `.then` function.  If that value is a promise, then it will be resolved (meaning the createAsync() function will have returned a value), and then that resolved value will be sent to the next `.then`.

Also the approaches in the `.then` chain in 1) and the promise array in 2) can be combined like this:

        results = {}
        nitro.createAsync(anotherModel)
            .then( function (_results) {
                // _results is the return value from creating anotherModel
                nitro.merge(results, _results);
                return nitro.createAsync(someOtherModel)
            }).then( function (_results)
                // _results is the return value from creating someOtherModel
                nitro.merge(results, _results);
                var somePromises = _.map(arrayOfModels, function(m) {
                    return nitro.createAsync(m)
                });
                return Promise.all( somePromises );
            })
            .then(nitro.aggregateResultsArray)
            .then( function (_results) {
                // _results is the aggregated results
                nitro.merge(results, _results);
                return nitro.createAsync(myBuyer3);
            })
            // nitro.displayResults() is a handy way to print out everything we've created
            // you can use it at any point along the .then() chain and passing a
            // descriptive string will override the label "raw results object(s)" with 
            // the passed string. 
            .then( nitro.displayResults('raw results for myModels') )
            .catch( function (err) {
                console.log('error making buyers:\n', err);
                // handle error
            });

The contents of results will be explained while we learn about how Nitro deals with foreign keys and relationships between tables.

[See the next example](relationships.md)

[Back to the intro](intro.md)

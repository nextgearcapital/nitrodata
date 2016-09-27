var nitro = require('nitro-client');
var m = nitro.nsModels;

var categoryModel = m.Production.ProductCategory().withName('Safety');
categoryModel.createNew();

nitro.createAsync(categoryModel)
    .then(function(results) {
        console.log(results);
    });



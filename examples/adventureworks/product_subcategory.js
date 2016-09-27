var nitro = require('nitro-client');
var m = nitro.nsModels;

var categoryModel = m.Production.ProductCategory().withName('Safety');
var subCategoryModel = m.Production.ProductSubcategory()
    .withName('Life Jackets')
    .withProductCategory(categoryModel)

var rawData = subCategoryModel.getData();
console.log('Data to send to Nitro:');
console.dir(rawData);

nitro.createAsync(subCategoryModel)
    .then(function(results) {
        console.log('\n\nData received from Nitro:');
        console.dir(results);
    });

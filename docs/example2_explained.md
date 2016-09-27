# Another Example Explained #

1. Create a model and specify your requirements.

        var categoryModel = m.Production.ProductCategory().withName('Safety');
        var subCategoryModel = m.Production.ProductSubcategory()
            .withName('Life Jackets')
            .withProductCategory(categoryModel)


2. Send the model to the Nitro service.

        createAsync(subCategoryModel)


3. Data sent to the Nitro server:

        {
          "model": "Production.ProductSubcategory",
          "attributes": {
            "Name": "Life Jackets",
            "ProductCategoryID": {
              "model": "Production.ProductCategory",
              "attributes": {
                "Name": "Safety"
              },
              "createMode": "useServerDefault",
              "count": 1
            }
          },
          "createMode": "useServerDefault",
          "count": 1
        }

4. Data returned from the Nitro server:

        {
          "ProductCategory": [
            {
              "productCategoryId": 5,
              "name": "Safety",
              "rowguid": "DBFA6E8E-BFD4-4C9B-9607-B9DEDD9DE0F7",
              "modifiedDate": "2016-05-22T21:35:57.703Z"
            }
          ],
          "ProductSubcategory": [
            {
              "productSubcategoryId": 38,
              "productCategoryId": 5,
              "name": "Life Jackets",
              "rowguid": "A3D02B94-D418-47B6-8095-4F6BD8A019F2",
              "modifiedDate": "2016-04-30T08:56:06.683Z"
            }
          ]
        }

5. Nitro processed the ProductCategory model first.  It searched to see if a ProductCategory with the name Safety exists.  If you ran the first example already, then Nitro will just return the ProductCategory already created.  If you haven't run the first example, then Nitro will create the ProductCategory named Safety.  Once the ProductCategory model is resolved by Nitro, it continues on to create the ProductSubcategory, putting the id of the ProductCategory, 5, into the productCategoryId field.


[Another Example](factories.md)

[Back to the intro](intro.md)

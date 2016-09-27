# A Simple Example Explained #

1. Create a model and specify your requirements.

        var categoryModel = m.Production.ProductCategory().withName('Safety');

2. Send the model to the Nitro service.

        createAsync(categoryModel)

 The client sends JSON to the server:

        {
            "model": "Production.ProductCategory",
            "attributes": {
                "Name": "Safety"
            },
            "createMode": 'useServerDefault',
            "count": 1
        }

 Data returned from the Nitro server:

		{
		  "ProductCategory": [
			{
			  "productCategoryId": 5,
			  "name": "Safety",
			  "rowguid": "DBFA6E8E-BFD4-4C9B-9607-B9DEDD9DE0F7",
			  "modifiedDate": "2016-05-22T21:35:57.703Z"
			}
		  ]
		}

 The Nitro server also has an internal data structure called the *model definition*, sometimes referred to as `models.json`.  It is available at `/models.json` on a running Nitro server, although it tends to be quite large.  You probably want to install a browser extension such as [JSONView](http://jsonview.com) to view it.  If you want to view an individual model's json go to `/models/<schema.model>` and scroll to the bottom.  The model definition below has been edited to remove unnecessary noise.

		{
			"prettyName": "ProductCategory",
			"namespace": "Production",
			"fields": {
				"ProductCategoryID": {
					// When enable is set to false, Nitro will leave this
					// field unpopulated, unless it is specified in the model
					"enable": false
				},
				"Name": {
					// When Name is not specified, Nitro will default it to "??"
					"value": {
						"default": "??"
					}
				},
				"rowguid": {
					// When rowguid is not specified, Nitro will insert a random uuid
					"value": {
						"fakerFunction": "faker.random.uuid()"
					},
				},
				"ModifiedDate": {
					// When ModifiedDate is not specified, Nitro will insert a random uuid
					"value": {
						"fakerFunction": "faker.date.past()"
					}
				}
			}
		}


### Did Nitro create this record or find it? ###

Qood Question!  Usually, Nitro will first try to find a record that matches the requirements given.  In this example the requirement is that the field `Name` must hold the value `Safety` in this `ProductCategory`.  If a matching record is found, Nitro returns it.  If Nitro can not find a matching record, it creates one itself.  When Nitro creates the record itself, it iterates through each field in the model definition, using the contents of the `value` hash to populate each field.  If you run this example, product\_categoy.js, multiple times, you will see that subsequent runs return the data created by the first run.  This can be verified by checking that the rowguid does not change between runs.

If you want to force Nitro to create a new one, you can add the following line of code to the example:

		categoryModel.createNew();

However this will cause the following error

		Cannot insert duplicate key row in object 'Production.ProductCategory' with unique index 'AK_ProductCategory_Name'. The duplicate key value is (Safety).

It is generally preferable to write Nitro code that can be run multiple times, but sometimes it isn't possible.  Many people just run Nitro to populate data once.  If they want to run their Nitro code again, they dump the database and start over.

[Another Example](example2_explained.md)

[Back to the intro](intro.md)

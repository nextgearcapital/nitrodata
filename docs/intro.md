# Introduction #

Nitro helps users, usually developers and testers, to create data rapidly and easily.  A user specifies the model they want to create, then the fields they care about.  Nitro will search the database.  If a matching record is found, it will be returned to the user.  If a matching record is not found, then a new instance (row) is created, and then returned to the user.


This documentation assumes you have a SQL Server database loaded with the AdventureWorks data.  It was tested on SQL Server 2012.

## Simple Example ##

1. Create a model and specify your requirements:

        var categoryModel = m.Production.ProductCategory().withName('Safety');

2. Send the constraints to the Nitro service:

        createAsync(categoryModel)

3. You now have a ProductCategory with the name 'Safety'!


## Table of Contents ##

[Getting Started (database setup)](getting_started.md)

[Explanation of how it works](example1_explained.md)

[A more advanced example](example2_explained.md)

[An example of Factories](factories.md)

[Create your model with promises](promise_example.md)

[Dealing with related models and foreign keys](relationships.md)

[Putting it all together with makers](makers.md)

[An example with comments](completeProduct_annotated.md)

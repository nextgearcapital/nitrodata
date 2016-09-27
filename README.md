# Nitro-  Data Generating Engine

Nitro is a utility for creating test data designed to make your life easier.

Nitro introspects your database and creates models for you to use, reducing the amount of boilerplate you have to write.

Nitro allows you to specify only the fields you care about, leaving other fields to be filled in automatically.

Nitro currently works with Microsoft SQL Server and APIs that support [ALPS](http://alps.io/spec/).  The ALPS support is known to work with APIs written using [Spring Data Rest](http://projects.spring.io/spring-data-rest/).

To generate data:

        var categoryModel = m.Production.ProductCategory().withName('Safety');
        createAsync(categoryModel)
            .then(function (results) {
                console.log(results);
            });

Start Nitro (MSSQL):

        $ NITRO_DB_USER=<username> NITRO_DB_PASSWORD=<password> NITRO_DB_NAME=AdventureWorks2012 NITRO_MODEL_OVERRIDES=examples/adventureworks/overrides node app.js

Start Nitro (ALPS):

        $ NITRO_DB_NAME=vault NITRO_DB_USER=<username> NITRO_DB_PASSWORD=<password> NITRO_DB_SERVER=<url of alps api> NITRO_BACKEND=alps_adaptor NITRO_DEFAULT_NAMESPACE=disabled NITRO_DEFAULT_CREATE_MODE=createNew node app.js

for more information, see [getting started](docs/getting_started.md)

To install client (after starting the server):


        $ npm install localhost:3000/client.tar

or

        $ npm install <path to nitro checkout>/client


For more information: see the [User Guide](docs/intro.md)

## Background and Motivation

Nitro was originally written for a legacy software project at NextGear Capital.  This legacy software was developed against shared databases that were scrubbed versions of the production database.  The schema grew in complexity to over 700 tables.  The database grew in size.  Nitro was then written to ease data creation for software development and integration testing.  Developers and testers now have control over their data!  If you have ideas of how to improve Nitro, please share them!

## Contributing

Contributions are welcome and are greatly appreciated! Every little bit helps.

## License

Nitro is licensed under the [Apache 2.0 License](license.md)

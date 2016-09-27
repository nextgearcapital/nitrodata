# Getting Started #

To follow the examples in this guide, you need a Sql Server database loaded with Microsoft's example AdventureWorks database.

[download the database .mdf file here](https://msftdbprodsamples.codeplex.com/downloads/get/165399)


## Attach .mdf file to database ##

[google knows all](https://www.google.com/search?btnG=1&pws=0&q=attach+mdf+without+ldf+management+studio)


## Assumptions ##

It is assumed that you have Sql Server and Management Studio installed.  This document was tested with Sql Server 2012.  It is also assumed that you have node and npm installed.  The code works with Node 0.12 or newer.

# Run Nitro #

In your nitro checkout, run `npm install` in the api, mssql_adaptor, and examples directory.

In your nitro checkout, run this command in the api directory:

        NITRO_DB_USER=<username> NITRO_DB_PASSWORD=<password> node app.js

Now you should see some startup and configuration information followed by: `Listening at http://127.0.0.1:3000`

[The first example](example1_explained.md)

[Back to the intro](intro.md)

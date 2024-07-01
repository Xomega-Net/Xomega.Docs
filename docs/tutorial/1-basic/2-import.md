---
sidebar_position: 2
---

# 1.2 Import Xomega model

The first thing you need to do to import the Xomega model from a database is to set up the connection properties for the corresponding generator.

## Configure database connection

Expand the *Generators* node in the *AdventureWorks.Model* project, and find the *Import from Database* generator under the *Model Enhancement* folder, which groups generators that enhance the model with additional information.

![Import generator](img2/import-generator.png) ![Import connection](img2/import-connection.png)

Double-click on the generator to open its properties, and click on the editor for the *Connection String* property, which will pop up a standard *Connection Properties* dialog that uses the default `SqlClient` connection provider for SQL Server. To use a provider for the latest features you can change the data source and select the `Microsoft SqlClient` provider as follows.

![Connection provider](img2/connection-provider.png)

Next, we will configure connection to the sample *AdventureWorks2022* database on the local SQL Server instance using windows authentication, as shown below.

![Connection properties](img2/connection-properties.png)

Once you click OK, you'll be prompted whether you want to save this configuration as the default for the project as follows.

![Save default](img2/save-default.png)

Click *Yes* to save it as a project default configuration.

## Run the import from a database

To run the import from the database, right-click on the *Import from Database* generator, and select the *Generate* option from the context menu.

![Import generate](img2/import-generate.png)

Once the generator is finished running, you should see the imported model files under the *Import* folder, which is specified in the generator's *Output Path* property by default. The imported files are organized to have each object in its own file, which roughly maps to the database tables, and grouped by module, which is derived from the database schema of the table. Here's how it will look.

![Import result](img2/import-result.png)

The model objects were imported from the database using the database structure, as well as any model setup that existed before the import, such as the logical types defined.

This is a good start, but it is not enough to build a fully-fledged application beyond just a "database table editor". To model our application and describe different services and views that it will have, we need to further enhance our model with all that information about application views, data objects and services, which is what we're going to do next.

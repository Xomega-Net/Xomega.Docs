---
sidebar_position: 4
---

# Database Change Script

Once you already have a database populated with data you will typically want to apply changes to the database by running an update script against your database to preserve your data.

This generator helps you build such a script based on your changes to the Xomega object model. The script can be made rerunnable, meaning that it will check if the necessary changes have already been made in the database before making a change.

## Generator inputs

The generator uses the structure of the target database and the current state of the Xomega model to generate a DDL update script that will bring the database in sync with the model.

## Generator outputs

This generator creates a rerunnable DDL script that makes updates to the target database to synchronize it with the current model. 

:::note
This is similar to using standard Entity Framework migration tools.
:::

## Configuration

By default, the generator configuration is defined under the `.Generators\Data Layer` folder in the model project as follows.

```xml title="Database Change Script.xgen"
<XomGeneratorConfig xmlns="http://schemas.xomega.net/v10/xgen"
                    xmlns:dbs="http://schemas.xomega.net/v10/xgen/db-script">

  <Generator Xsl="Database/diff.xsl"
             DbSchemaNeeded="true"
             DbTimeout="30"/>
  
  <dbs:Output Path="Sql/db_update.sql"/>
  
  <dbs:Parameters Rerunnable="false"/>

</XomGeneratorConfig>
```

### Generator parameters

The following table describes configuration parameters for the generator.

|Parameter|Value Example|Description|
|-|-|-|
|Xsl|Database/diff.xsl|Relative path to the XSLT file used by the generator to generate the DDL update script.|
|DbSchemaNeeded|true|Indicates that the generator requires a database schema, which in turn requires a valid database connection. If no default connection is available, running the generator will prompt for one. The value should be always set to `true`.|
|DbTimeout|30|Specifies the timeout in seconds for the database connection.|
|**dbs:Output**|
|Path|../database/db_update.sql|Relative path where to output generated DDL update script.|
|**dbs:Parameters**|
|Rerunnable|true|Specifies whether to make the generated SQL script rerunnable. Default is false.|

### Model project parameters

The generator will also use the following parameters from the model project settings, which are set automatically when you save database connection as the default connection for the model project, or you can set them manually in the model project properties.

|Parameter|Value Example|Description|
|-|-|-|
|Database|SQL Server|Database type for the DDL script: `SQL Server` or `PostgreSQL`.|
|Database Case|PascalCase|The database case for the database objects' names: `PascalCase`, `lower_snake` or `UPPER_SNAKE`.|
|Database Version|16.0|The version of the database for the DDL script.|

### Model configuration

The generator doesn't use any other global configurations in the model.

### Common configurations

The generator configuration allows you to specify a database connection string for the database that you need to update. You can either use the project's default settings or provide a specific database.

:::tip
Sometimes you may want to connect to different databases, e.g. to generate incremental changes for the bleeding edge development database, and then, closer to the release, generate an update script for a more stable testing database.
:::

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only. For that, you need to select it in the model project, and then select *Generate* menu from either the context menu or the top-level *Project* menu.

You can rerun the generator when you change any objects, fields, or types in the model, which may require re-running other generators that depend on the same model elements, such as the generator of [Service Implementations](../services/service-impl).

:::tip
You don't need to include this generator in the model build process. Normally, you need to run it only when you are ready to apply your model change to your database, but you can also run it as a `diff` tool to check if any of your model changes affected the database structure.
:::

### Customizing the output

:::danger
You should always carefully review the generated script before running it, to make sure it doesn't cause any negative side effects.
:::

If, upon review, you determine that the generated script needs to be updated, you should make your updates in a copy of the script to preserve your changes. Any additional scripts that need to be run for the migration must be in separate files.

### Cleaning the generator’s output

The generator doesn't support cleaning the generated output.

Once you run the update DDL script against your database, a subsequent run of this generator should produce an empty update script, which would indicate that the target database is in sync with the model.
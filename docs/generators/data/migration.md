---
sidebar_position: 4
---

# Database Change Script

Once you already have a database populated with data you will typically want to apply changes to the database by running an update script against your database to preserve your data.

This generator helps you build such a script based on your changes to the Xomega object model. The script will be rerunnable, meaning that it will check if the necessary changes have already been made in the database before making a change.

## Generator inputs

The generator uses the structure of the target database and the current state of the Xomega model to generate a DDL update script that will bring the database in sync with the model.

:::tip
If certain database tables have been specifically excluded from the object model, you need to make sure that they are excluded in the database connection configuration as well. Otherwise, the generator will assume that they have been deleted from the model and will add statements to drop those tables into the script.
:::

## Generator outputs

This generator creates a rerunnable DDL script that makes updates to the target database to synchronize it with the current model. 

:::note
This is similar to using standard Entity Framework migration tools.
:::

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Database Change Script|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Data Layer|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|False|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../database/db_update.sql|Relative path where to output generated DDL update script.|
|**Database**|
|Database|SQL Server|Database type of the target database. Currently only SQL Server (`sqlsrv`) is supported. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Version|11.0|The version of the target database. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Case|CamelCase|The database case for the database objects' names: `UPPER_CASE`, `lower_case` or `CamelCase`. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Connection|Use Project Settings|Database connection string for the target database. Edited via a *Database Connection Configuration* dialog, which also sets the other *Database* parameters of the generator, and allows selecting tables to exclude from the model, as well as saving all this configuration for the entire project. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|

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
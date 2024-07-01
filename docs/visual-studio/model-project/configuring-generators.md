---
sidebar_position: 2
---

# Configuring Generators

You can configure generators either by setting generator parameters or by providing a global configuration in the model.

## Generator parameters

You can configure generator parameters in the *Properties* view for the selected generator. They are typically grouped into logical categories under the *Properties* tab. Let's review some typical parameter categories.

### Common parameters

All generators have a set of common parameters that include the `Generator Name`, `Folder Name`, and whether or not it should be included in the build of the model project, as follows.

![Common parameters](img/params-common.png)

You can configure the folder as a path to the generator in the *Solution Explorer*, separated by backslash (\\). You can also change the name of the generator here, or you can rename it directly in the tree view by hitting F2.

:::note
The common parameters will also display the physical path to the generator's XSL stylesheet under the `Generator Path` parameter, which you won't be able to update through the *Properties* view.
:::

### Output paths

Most of the generators that output one or more files, when run, allow specifying relative paths for the target output, as illustrated below.

![Path parameters](img/params-paths.png)

The relative paths oftentimes point to other projects in the solution and allow specifying special placeholders like `{Module}` and `\{File\}`. This provides you with the maximum flexibility in how you want the generated code to be structured.

For instance, if you don't include any of these placeholders, the generated objects will be all output into the same file. This is how some generators used to do it, e.g. the *Entity Data Model*. While it may be convenient in some cases to keep all generated code in one file, that file could become quite large and hard to navigate, when you want to troubleshoot your app.

If you include just the `{Module}` placeholder, then the generator will create one file per module. This could still result in large generated files but falls somewhere in the middle between a single file and individual files.

The recommended practice is to include both the `{Module}` and `\{File\}` placeholders to output generated code into individual files based on the context. The `{Module}` placeholder will allow you to group generated files by module in separate folders or using a naming convention (e.g. `{Module}_\{File\}`).

:::note
You can move the separator inside the braces, e.g. `\{Module/\}` to account for an empty module name, which would otherwise result in a double slash (//) in the path, and make the latter invalid.
:::

Based on your preferences and development standards, you can configure the generated files to be all completely isolated in a separate folder (e.g. with `Gen/\{Module/\}/\{File\}`), have them co-mingled with custom files, or a combination of the two, e.g. with `\{Module/\}Gen/\{File\}`, which will result in the generated files being isolated within each module. Each approach has its pros and cons.

:::tip
To check if a specific parameter allows any placeholders, you can view its description in the *Properties* window, as illustrated above for the `Custom Path` parameter, or you can check the [documentation](../../generators/overview) for that generator.
:::

### Database parameters

Some generators that require a connection to the database, e.g. to read the database structure or the actual data, will have a set of database-related parameters, as shown below.

![Database parameters](img/params-db.png)

#### Configuring connection info

The `Connection String` is edited via the standard VS *Connection Properties* dialog, where you can specify the connection parameters, including any advanced properties, as illustrated below.

![Connection properties](img/connection-properties.png)

Initially it will use the default data provider of the data source for the selected database, but you can change the data source and/or the data provider by clicking the *Change* button, as follows.

![Data sources](img/data-source.png)

:::warning
To enable the `PostgreSQL Database` data source you need to install VS extension [*Npgsql PostgreSQL Integration*](https://marketplace.visualstudio.com/items?itemName=RojanskyS.NpgsqlPostgreSQLIntegration).
:::

#### Saving database config as default

Since generators that need DB connection may need to share the same DB configuration, you can save these parameters as the project default, rather than for the specific generator, so that other generators could also use it. After you select the database connection parameters for a generator, you will be asked if you want to save them as default for the model project as follows.

![Save as default](img/save-default.png)

If you choose *Yes*, the connection parameters will be displayed on the properties of the *Model* project, while the properties of the generator will show the *Use Project Setting*, as shown below.

![Database parameters](img/params-use-project.png)

#### Resetting connection info

To reset the connection info you can select the *Reset Connection Info* option under the `Data Provider` property. On the *Model* project it will be the only option, as shown below.

![Reset project connection](img/reset-connection-model.png)

On the generators you will also have an option to reset it to the *Model* project's default parameters by selecting the *Use Project Setting* option, as shown bellow.

![Reset generator connection](img/reset-connection-generator.png)

## Creating multiple configurations

Xomega.Net allows you to clone any existing generator configuration, and save it as a new configuration under a different name. You can do it by selecting the generator in the project, pressing *Ctrl+C*, and then renaming the new generator as appropriate.

:::tip
You can always delete the cloned configuration later by pressing *Delete* on it.
:::

This is useful for flexible generators that support many different parameters, such as the [*Full CRUD with Views*](../../generators/model/crud) model enhancement generator, which adds specified elements, like operations or data objects and views, to your model.

With this generator, you can create configurations that add only a specific type of element by turning everything off except for that one parameter. For example, you can have a generator that adds only REST methods to the operations.

You can also have a configuration of this generator that adds everything to the model at once, or you can create configurations for any combinations of the elements that you need to add as required.

:::info
The [documentation](../../generators/overview) of each generator typically specifies some common configurations, where applicable.
:::

## Global model configuration{#global}

The global model configuration is defined under the top-level `config` element in the model and contains configuration that is available to all generators so that it could be shared between multiple generators, where it cannot be specified as parameters of individual generators.

:::tip
You can view detailed documentation on the global configuration [here](../modeling/config). To see how it is used by individual generators, you can also check the [documentation](../../generators/overview) on each specific generator.
:::

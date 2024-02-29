---
sidebar_position: 1
---

# Import from Database

This generator helps you jump-start Xomega object modeling by importing the model from an existing SQL Server database. The generator builds the objects and fields from the corresponding database tables and columns, declares logical types and field sets for object keys to preserve relationships between objects, and declares reusable types for all other object fields.

Before running the generator though, you need to make sure you pre-configure the model as described below.

## Generator inputs

The generator takes the structure of the target database and creates model types, field sets, and objects for the database tables, except for any tables that were excluded from the import.

### Logical Types

The generator will try to map the database types to one of the existing Xomega types or, if not possible, will define a new type that derives from one of the existing types.

Therefore, before you run the import you may want to make sure the existing types' configuration is consistent with your current system standards. For example, the `boolean` type maps by default to a SQL Server type `bit`, as shown below.

```xml
<type name="boolean">
  <config>
<!-- highlight-next-line -->
    <sql:type name="bit" db="sqlsrv"/>
  </config>
  <usage generic="true"/>
  <doc>
    <summary>Boolean value that can be either True (1) or False (0).</summary>
  </doc>
</type>
```

However, if the standard for your current system is `tinyint` to store a boolean, then you should update the Xomega type to map to `tinyint` so that it can be properly identified by the generator.

### Field-sets

By the same token, the generator can identify groups of fields that match one of the field sets defined in the model and use a reference to the field set instead of those fields.

If all or most of your tables, for example, have a set of standard audit columns, such as the user who created the record and the creation timestamp, then you can just define such a field set in your model first and it will be automatically used by the imported objects.

```xml
<fieldset name="audit fields">
  <field name="created by" type="user id"/>
  <field name="created on" type="date time"/>
</fieldset>
```

If later on, you will want to also add the user who last modified the record and the last modification time stamp, then you could just add them to that fieldset definition and they will be automatically included in all the objects that use that fieldset.

```xml
<fieldset name="audit fields">
  <field name="created by" type="user id"/>
  <field name="created on" type="date time"/>
<!-- highlight-start -->
  <field name="modified by" type="user id"/>
  <field name="modified on" type="date time"/>
<!-- highlight-end -->
</fieldset>
```

### Foreign Keys for Subobjects.

What you should also be cognizant of is that Xomega subobjects are inseparable from their parent objects and require a cascading deletion whenever their parent object is deleted. As a result, for the *Import* generator to define objects as subobjects, their foreign key relationship to the parent object should have cascading deletion and the columns on both ends of the relationship should have the same names.

:::tip
If you would like some tables to be imported as child objects then you may want to consider updating their foreign key relationship accordingly before the import.
:::

You can obviously refactor the model structure after you import it, but sometimes it may be easier to make some changes in the model or the database initially, delete the generated objects, and re-import them again.

## Generator outputs

This generator creates single or multiple `.xom` files with objects, field sets, and logical types as defined by the *OutputPath* parameter, and adds them to the model project.

### Logical Types

For the columns where the generator cannot map the database type to one of the existing Xomega types, it will define a new type that derives from one of the existing types and will use it on all columns with the same type, as illustrated below.

```xml
<types>
  <type name="char string10" base="char string" size="10"/>
  <type name="string128" base="string" size="128"/>
  <type name="decimal_9_4" base="decimal">
    <config>
<!-- highlight-next-line -->
      <sql:type name="decimal(9,4)" db="sqlsrv"/>
    </config>
  </type>
</types>
```

You can rename and refactor such types after the import to give them proper logical names, e.g. `phone number`.

### Key Types

For primary keys, the generator will define either a simple logical type or a fieldset, if the key is composite with more than just the parent table's key. The following snippet illustrates this setup.

```xml
<types>
<!-- highlight-next-line -->
  <type name="person" base="business entity"/>
</types>
<fieldsets>
<!-- highlight-next-line -->
  <fieldset name="person phone">
    <field name="business entity id" type="person" required="true"/>
    <field name="phone number" type="string25" required="true"/>
    <field name="phone number type id" type="phone number type" required="true"/>
  </fieldset>
</fieldsets>
<objects>
  <object name="person">
    <fields>
<!-- highlight-next-line -->
      <field name="business entity id" type="person" key="supplied" required="true"/>
      <field name="person type" type="person type" required="true"/>
      <field name="first name" type="name" required="true"/>
      <field name="last name" type="name" required="true"/>
      <field name="suffix" type="string10"/>
      <field name="additional contact info" type="xml"/>
      <field name="rowguid" type="guid" required="true"/>
      <field name="modified date" type="date time" required="true"/>
    </fields>
  </object>
  <object name="person phone">
    <fields>
<!-- highlight-next-line -->
      <fieldset ref="person phone" key="supplied" required="true"/>
      <field name="modified date" type="date time" required="true"/>
    </fields>
  </object>
</objects>
```

:::note
For sub-objects, the primary key of the parent object will be dropped from the list of fields, as it is included implicitly.
:::

### Fixed Table Names

If you set the *Keep Table Names* parameter of the generator to `true`, the generated objects will have a configuration element with a `sql:table` element that provides a mapping to the DB table name, as follows.

```xml
<object name="person">
  <fields>...</fields>
  <config>
<!-- highlight-next-line -->
    <sql:table name="Person.Person"/>
  </config>
</object>
```

This allows renaming generated objects without worrying about affecting the table name.

:::warning
Without such a configuration, the table name for the object will be implicitly derived from the object's full name using specified database naming conventions (case).
:::

### Fixed Column Names

If you set the `Keep Column Names` parameter of the generator to `true`, the fields on generated objects will have a configuration element with a `sql:column` element that provides a mapping to the DB column name, as follows.

```xml
<field name="business entity id" type="person" key="supplied" required="true">
  <config>
<!-- highlight-next-line -->
    <sql:column name="BusinessEntityID"/>
  </config>
</field>
```

This allows renaming generated objects' fields without worrying about affecting the column name.

:::warning
Without such a configuration, the column name for the field will be implicitly derived from the field's name using specified database naming conventions (case).
:::

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Import from Database|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Model Enhancement|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|False|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|Import/\{Module/\}\{File\}.xom|Relative path where to output generated .xom files, which will be added to the model project. The path may contain \{Module/\} and \{File\} placeholders to output files by database schema and table respectively.|
|**Database**|
|Database|SQL Server|Database type of the source database. Currently only SQL Server (sqlsrv) is supported. Value 'Use Project Settings' takes this value from the corresponding property of the model project.|
|Database Version|11.0|The version of the source database. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Case|CamelCase|The database case for the database objects' names: `UPPER_CASE`, `lower_case` or `CamelCase`. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Connection|Use Project Settings|Database connection string for the source database. Edited via a *Database Connection Configuration* dialog, which also sets the other *Database* parameters of the generator, and saving all this configuration for the entire project. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|**Naming&nbsp;Convention**|
|Keep Table Names|True|Whether or not to preserve table names in generated objects.|
|Keep Column Names|True|Whether or not to preserve column names in generated objects.|
|Keep Constraint Names|False|Whether or not to preserve constraint names in generated objects.|
|Naming Case|lower|The case to use for logical names: `lower`, `upper` or `camel`. Leave empty to use DB names as is.|
|Naming Delimiter|space|The delimiter to use for logical names: `space`, `underscore` or `dash`. Leave empty to use DB names as is.|

### Model configuration

The generator doesn't use any other configuration parameters from the model.

### Common configurations

When importing the model from a database you should, first of all, define the database connection for the generator. You can do it via the *Database Connection Configuration* dialog that pops up from the generator's *Properties* page. In that dialog, you should specify an OLE DB connection string to your database, which Xomega will validate and will use to read your database metadata.

On the next tab of the dialog, you can specify which database tables you would like to exclude from the model. Next, the system will try to determine if your database names are case-sensitive and will set the *Database Case* to `CamelCase` or your choice of `UPPER_CASE` or `lower_case` respectively, which will be used for generating tables for all new objects as well.

It makes sense to save this database configuration as default project settings, which will be one of the options in the dialog so that all other database-related generators could reuse the same settings. This way, for example, the *Database Change Script* generator won't try to remove the tables that have been explicitly excluded from the model.

If you save it as a default configuration then it will be available on the model project's *Properties* page, and the corresponding generator properties will be set to the '*Use Project Setting*' value.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire database or a subset of tables after configuring the database generator parameters.

:::warning
The model must contain no objects with fields defined when the generator runs to prevent overwriting any custom changes if you rerun it. You may have some services defined though, which are objects with operations but no fields.
:::

The generated Xomega files will be automatically added to the project under the folder designated by the *Output Path* property.

:::tip
You can make it output to the project folder, but initially, you may want to consider generating it in some project sub-folder (such as the default `Import/` folder). This will allow you to review the generated files, and clean them all easily if you realize that you need to make any adjustments in the database or the configuration, and then rerun the generator.
:::

### Customizing the output

If upon review of the imported model you would like to re-import it differently, you will need to *remove all of the generated objects*, make the necessary changes in the generator parameters, such as whether or not to keep table or column names, in the model, such as defining new types or fieldsets that can be used by the import, or in the database, such as adding foreign keys with cascade delete between parent objects and sub-objects, and then rerun the generator.

After that, you can make any necessary changes directly in the model without rerunning the generator anymore.

### Cleaning the generator’s output

This generator does not support the cleaning of the generated files.

While you review the initial import of the model from the database, you may want to output the imported objects into a dedicated folder under the model project, so that it would be easy to delete the generated folder, make the necessary updates, and rerun the generator.
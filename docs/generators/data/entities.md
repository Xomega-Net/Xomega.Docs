---
sidebar_position: 1
---

# EF Domain Objects

Generates C# classes for Entity Framework (EF) domain objects, `DbContext`, and entity configurations using Fluent API from the Xomega object model. These entity classes are then used by the service classes generated by the [Service Implementations](../services/service-impl) generator, or by any custom backend code as needed.

:::note
The generator can generate classes for either Entity Framework 6.x or Entity Framework Core.
:::

## Generator inputs

The generator uses objects and their fields defined in the model to create EF entities and their configurations.

It also leverages the structure of sub-objects, as well as the way key fields or fieldsets are set up, to infer the associations between the entities so that they wouldn't need to be defined explicitly.

### Objects and associations

For primary objects (i.e. not sub-objects) with a single key field, the generated entities will have a set of properties based largely on the list of the object's fields.

Xomega model requires key fields to have dedicated types declared in the model. If such a key type (or any of its derived types) is used for a non-key field, or a field with a `key="reference"` attribute, then that field will be assumed to reference the object, for which this is a key type. In this case, the entity will also contain the referenced entity using the field's name and a postfix "Object".

The following example illustrates how the key field `customer id` of the `customer` object uses a dedicated type, also named `customer`, while the `customer id` field of the `sales order` object below it also uses this type, thereby referencing the `customer` object.

```xml
<types>
  <type name="sales order" base="integer key"/>
<!-- highlight-next-line -->
  <type name="customer" base="integer key"/>
</types>
<objects>
  <object name="customer">
    <fields>
<!-- highlight-next-line -->
      <field name="customer id" type="customer" key="serial" required="true"/>
      <field name="person id" type="person"/>
      <field name="store id" type="store"/>
      <field name="account number" type="char string10" required="true"/>
    </fields>
  </object>
  <object name="sales order">
    <fields>
      <field name="sales order id" type="sales order" key="serial" required="true"/>
      <field name="order date" type="date time" required="true"/>
<!-- highlight-next-line -->
      <field name="customer id" type="customer" required="true"/>
    </fields>
  </object>
</objects>
```

If the object contains a field set in the list of fields, then the entity will contain all fields from that field set, using its fields' names prefixed with the name of the field set in the object, if set.

If the object has a sub-object defined, then the entity will have a collection of the associated sub-object entities, with a name of the subobject and a postfix "ObjectList".

### Complex associations and subobjects

If an object has a composite key, then it should have a dedicated field set declared in the model, which will be used with `key="supplied"` on that object.

If such a fieldset is used in another object's fields without a `key` attribute, or with `key="reference"`, then that other object will be considered as referencing the object with a composite key.

The following example shows how the `special offer product` object has a composite key implemented by the corresponding fieldset with the same name, and the `detail` subobject of the `sales order` object uses that fieldset, thereby referencing the `special offer product` object.

```xml
<fieldsets>
<!-- highlight-next-line -->
  <fieldset name="special offer product">
    <field name="special offer id" type="special offer" required="true"/>
    <field name="product id" type="product" required="true"/>
  </fieldset>
</fieldsets>
<objects>
  <object name="special offer product">
    <fields>
<!-- highlight-next-line -->
      <fieldset ref="special offer product" key="supplied" required="true"/>
    </fields>
  </object>
  <object name="sales order">
    <fields>[...]
    <subobjects>
      <object name="detail">
        <fields>
          <field name="sales order detail id" type="sales order detail" key="serial" required="true"/>
          <field name="order qty" type="small int" required="true">
<!-- highlight-next-line -->
          <fieldset ref="special offer product"/>
        </fields>
      </object>
    </subobjects>
  </object>
</objects>
```

The key of the parent object is automatically included in all of its subobjects, and there will be a reference to the parent entity generated on each subobject entity. On top of that, if the key on the subobject is not `serial` (i.e. not unique), the parent object's key will be part of the subobject's key as well.

### Field configurations

The EF configuration for the properties of the generated entities will be largely driven by the configuration of the field's type or its based types.

The property type comes from the `clr:type` config element of the field's type, but additional configurations, such as `FixedLength`, `Unicode`, or `Precision` may come from the corresponding `sql:type` element. The maximum size of the field comes from the `size` attribute of the type itself.

Whether or not the entity property is required comes from the `required` attribute on the field. Additional field-specific EF configurations, such as the `ConcurrencyMode` can be specified under the field's `edm:property` config element.

The following example illustrates EF configuration for the logical type `city name` and additional field-specific EDM attributes for the `rowguid` property.

```xml
<types>
<!-- highlight-next-line -->
  <type name="city name" base="string" size="30"/>
    <config>
<!-- highlight-start -->
      <clr:type name="string" xmlns:clr="http://www.xomega.net/clr"/>
      <sql:type name="nchar" db="sqlsrv" xmlns:sql="http://www.xomega.net/sql"/>
<!-- highlight-end -->
    </config>
  </type>
</types>
<objects>
  <object name="address">
    <fields>
      <field name="address id" type="address" key="serial" required="true">
<!-- highlight-start -->
      <field name="city" type="city name" required="true">
      <field name="rowguid" type="guid" required="true">
<!-- highlight-end -->
        <config>
<!-- highlight-next-line -->
          <edm:property ConcurrencyMode="None" xmlns:edm="http://www.xomega.net/edm"/>
        </config>
      </field>
      <field name="modified date" type="date time" required="true"/>
    </fields>
  </object>
</objects>
```

## Generator outputs

This generator creates C# classes for EF entities, their configurations using Fluent API, and a subclass of the `DbContext` that contains all those entities and registers their configurations.

The classes for entities and configurations can be placed in separate files by domain object, grouped by module, or output to a single file, depending on how you set up your *Output Path* parameter. The generated files for the entity configuration will be nested under the files for the corresponding entities according to the rules specified in the `.filenesting.json` file for the target project.

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|EF Domain Objects|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Data Layer|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Entities /Entities/\{Module/\}\{File\}.cs|Path where to output files with generated Entity Framework Domain Objects. The path may contain \{Module/\} and \{File\} placeholders to output files by module and domain object respectively.|
|Database Config File|../MySolution.Services.Entities /db.config|Application config file to add the entity database connection string to. Leave it blank if you don't want entity database connection string to be added to your config automatically.|
|**Database**|
|Connection String|Use Project Setting|Database connection string for the `DbContext`. Edited via the standard VS *Connection Properties* dialog, which also sets the other *Database* parameters of the generator, and allows saving it for the entire project. Value '*Use Project Setting*' takes this value from the corresponding property of the model project.|
|Data Provider|.NET Framework Data Provider for SQL Server|Name of the data provider selected for the connection string. Value '*Use Project Setting*' takes this value from the corresponding property of the model project. Option *Reset Connection Info* allows resetting the connection string.|
|Database|SQL Server|Database type of the source database. Value '*Use Project Setting*' takes this value from the corresponding property of the model project.|
|Database Case|PascalCase|The database case for the database objects' names: `PascalCase`, `lower_snake` or `UPPER_SNAKE`. Value '*Use Project Setting*' takes this value from the corresponding property of the model project.|
|Database Version|16.0|The version of the source database. Value '*Use Project Setting*' takes this value from the corresponding property of the model project.|

### Model configuration

The configuration parameters for the generator that need to be also accessible to other generators are specified in the Xomega model in the `edm:entities-config` element under the top-level `config` element, which is conventionally placed in the `global_config.xom` file.

A boolean parameter `efCore` indicates whether to generate classes for Entity Framework Core (`true`) or Entity Framework 6.x (`false`).

Other parameters include the namespace for the generated entity classes, as well as the name of the `DbContext` subclass to use, as shown below.

```xml title="global_config.xom"
<edm:entities-config efCore="true" namespace="MySolution.Services.Entities" context="MySolutionEntities"/>
```

### Common configurations

There is expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator either for the entire model or for individual files by selecting them in the model project and running the generator from the context menu.

You can rerun the generator when you change any objects, fields, or types in the model, which may require re-running other generators that depend on the same model elements, such as the generator of [Service Implementations](../services/service-impl).

:::tip
This generator can be included in the build of the model project in the configuration while the entity schema is still changing, such as during initial prototyping and development.

After that, it can be excluded from the build, and rerun manually whenever the schema changes.
:::

### Customizing the output

:::danger
You should never edit the generated entity classes directly to avoid losing your changes when you rerun the generator.
:::

The generated entity classes are declared as partial, so you can add any fields to them by declaring your own partial classes in separate files. You can have such a partial class generated automatically for you if it doesn't exist yet if you add `edm:customize` element to the object's `config` element, and set the `extend="true"` attribute, as follows.

```xml
<object name="person">
  <fields>[...]
  <config>
<!-- highlight-next-line -->
    <edm:customize extend="true"/>
  </config>
</object>
```

The file for the generated partial class will have `Extended.cs` postfix and will be nested under the corresponding entity file according to the rules specified in the `.filenesting.json` file for the target project.

To customize the generated subclass of `DbContext` you need to declare your own class that extends from the generated context class, and then register your custom class instead of the generated context class with the Dependency Injection container during the application start-up.

In your custom context class, you can specify your own Entity Framework-related behavior, including the way to obtain the database connection, logging behavior, etc. You can also override the `OnModelCreating` method to specify any additional configuration of the domain entities or to update the generated configuration using Fluent API.

### Cleaning the generator’s output

This generator supports cleaning either all generated entities or only the ones from the selected model files using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the domain objects from the model, and want the generated classes deleted and removed from the target project.
:::
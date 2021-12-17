---
sidebar_position: 2
---

# Entity Data Model

Generates Entity Data Model `.edmx` file from the Xomega object model with proper associations between entities, which allows to graphically view the domain model in Visual Studio on a single or multiple diagrams.

:::note
The generated Entity Data Model is **no longer used by the application** either in runtime or for generation of C# classes from the EDM, and is therefore available only for creation of graphical diagrams of the domain model.
:::

The application now uses the [EF Domain Objects](entities.md) generator to create entity classes and their EF configurations, as well as the DB context, which are further used by the generated service implementations.

## Generator inputs

The generator uses objects and their fields defined in the model to create EDM entities for both the conceptual model and the storage model.

It also leverages the structure of sub-objects, as well as the way key fields or fieldsets are set up, in order to infer the associations between the entities, so that they wouldn't need to be defined explicitly.

### Objects and associations

For primary objects (i.e. not sub-objects) with a single key field, the generated entities will have a set of properties based largely on the list of the object's fields.

Xomega model requires key fields to have dedicated types declared in the model. If such a key type (or any of its derived types) is used for a non-key field, or for a field with a `key="reference"` attribute, then that field will be assumed to reference the object, for which this is a key type. In this case, the entity will also contain the referenced entity using field's name and a postfix "Object".

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

If the object contains a fieldset in the list of fields, then the entity will contain all fields from that fieldset, using its fields' names prefixed with the name of the fieldset in the object, if set.

If the object has a sub-object defined, then the entity will have a collection of the associated sub-object entities, with a name of the subobject and a postfix "ObjectList".

### Complex associations and subobjects

If an object has a composite key, then it should have a dedicated fieldset declared in the model, which will be used with `key="supplied"` on that object.

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
    <fields>...</fields>
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

### EDM attributes

The EDM attributes for the properties of the generated entities will be largely driven by configuration of the field's type or its based types.

The actual EDM type is specified on the `edm:type` config element of the field's type, which may contain some additional attributes as well. The maximum size of the field will come from the `size` attribute of the type itself.

Whether or not the entity property is required comes from the `required` attribute on the field, but each field can have additional field-specific EDM configuration under its `edm:property` config element.

The following example illustrates EF configuration for the logical type `city name`, and additional field-specific EDM attributes for the `rowguid` property.

```xml
<types>
<!-- highlight-next-line -->
  <type name="city name" base="string" size="30"/>
    <config>
<!-- highlight-next-line -->
      <edm:type Type="String" FixedLength="true" xmlns:edm="http://www.xomega.net/edm"/>
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

This generator creates *Conceptual Model*, *Storage Model* and an *EDM Mapping* between the two in the specified `.edmx` file, including all the necessary Entities and Associations between them.

This helps to hide the complexities and intricacies of different EDM models.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Entity Data Model|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Data Layer|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Entities /Entities/EntityModel.edmx|Relative path where to output generated Entity Data Model file.|
|**Database**|
|Database|SQL Server|Database type for the Entity Data Model. Currently only SQL Server (`sqlsrv`) is supported. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Case|CamelCase|The database case for the database objects' names: `UPPER_CASE`, `lower_case` or `CamelCase`. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Version|11.0|The version of the database for the Entity Data Model. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|**Parameters**|
|Model Name|MySolution|The base name to use when generating the Entity Data Model.|

### Model configuration

The generator doesn't use any other configuration parameters from the model.

### Common configurations

There expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

To run this generator, you need to select it in the model project, and then select *Generate* menu from either the context menu or the top-level *Project* menu.

You can rerun the generator when you change any objects, fields or types in the model, and would like to generate updated diagrams. The layout of any diagrams created via the EDM designer should be preserved after you regenerate the EDM.

### Customizing the output

:::danger
You should never edit the properties of the generated Entity Data Model directly to avoid losing your changes when you rerun the generator. You should make your updates to the Xomega model instead.
:::

You can lay out the generated EDM entities on different diagrams in the EDM designer, and they should be preserved when the EDM is regenerated, but it's still better to move the diagrams to a separate file in the designer.

### Cleaning generator’s output

The generator doesn't support cleaning the entities, since all entities are regenerated when you rerun the generator.
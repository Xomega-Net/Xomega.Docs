---
sidebar_position: 4
---

# Enumeration Reload SQL

Generates a rerunnable SQL script for reloading enumerations defined in the Xomega model into one generic dictionary table, or separate tables, as configured for each enumeration.

Those database tables should have corresponding objects defined in the model, which will have configurations of how the object fields map to the structure of Xomega enumerations.

:::info
This generator is useful when you want to maintain your static data both in the Xomega model, so that it could be version controlled, allows inheritance and generation of other artifacts (such as constants) from it, and also have the static data in the database, which allows using it in SQL queries and stored procedures, and loading it from the database in runtime.
:::

## Generator inputs

The generator takes any static enumerations declared in the model using `enum` element that have a configuration of the enumeration source specified, and creates a rerunnable SQL script to load enumeration items and properties into the source tables.

If enumeration inherits from another enumeration, the list of items will be merged with the base enumeration.

### Enumeration source objects

The source for the enumeration items in the database is specified by a `sql:enum-source` element nested under the enumeration's `config` element.

In the source element you need to set the `items-object` attribute that points to an object defined in the model for the source table, which has a mapping between the object fields and enumeration structure.

Since each enumeration item may have multi-value properties, you can also specify a separate (sub-) object that holds properties for enumeration items in the `item-properties-object` attribute, as illustrated below.

```xml
<enums>
  <enum name="marital status">
    <item name="Single" value="S"/>
    <item name="Married" value="M"/>
    <config>
      <sql:enum-source items-object="dictionary" item-properties-object="dictionary.property"/>
    </config>
  </enum>
</enums>
```

### Source object configuration

The objects that are set as a source of enumeration items for one or multiple enumerations must have an element `sql:enum-items` element nested under their `config` element, which provides a mapping between the object fields and the enumeration structure.

Specifically, it should set which of the object's fields store the value, text and description of enumeration items in its attributes `item-value`, `item-text` and `item-desc` respectively.

If the object represents a generic dictionary that contains items for multiple enumerations, then you must indicate which field stores the name of the enumeration in its `enum-name` attribute.

You can also set the `default="true"` attribute on a generic dictionary, which will make it a source for any enumerations that don't have an explicitly configured `sql:enum-source` configuration.

For any other field of the object, you should add nested `sql:property` elements to indicate which single-value property it maps to, or a `sql:fixed` element to set the field to a fixed value or a formula.

Similarly, objects that store multi-value properties of enumeration items, or properties of generic dictionaries for multiple enumerations, must have an element `sql:enum-item-properties` element nested under their `config` element, specifying which of the object's fields store the item value, property name and property value in its attributes `item-value`, `property-name` and `property-value` respectively.

If the object is part of a generic dictionary that contains item properties for multiple enumerations, then you must indicate which field stores the name of the enumeration in its `enum-name` attribute.

You can also set the `default="true"` attribute in this case, which will make it a source of properties for any enumerations that don't have an explicitly configured `sql:enum-source` configuration.

For any other fields of the object, you can add nested `sql:fixed` element to set the field to a fixed value or a formula.

The following example illustrates such a configuration for a generic `dictionary` object, with a subobject `property` that holds values for additional properties.

```xml
<fieldset name="dictionary key">
  <field name="enumeration" type="enum name"/>
  <field name="item code" type="enum item code"/>
</fieldset>
 
<object name="dictionary">
  <fields>
    <fieldset ref="dictionary key" key="supplied"/>
    <field name="text" type="enum item text"/>
    <field name="description" type="enum item desc"/>
    <field name="addl field" type="string"/>
    <field name="reload date" type="date time"/>
  </fields>
  <config>
<!-- highlight-start -->
    <sql:enum-items default="true" enum-name="enumeration" item-value="item code"
                    item-text="text" item-desc="description">
      <sql:property field-name="addl field" property-name="addl prop"/>
      <sql:fixed field-name="reload date" fixed-value="GetDate()"/>
    </sql:enum-items>
<!-- highlight-end -->
  </config>
  <subobjects>
    <object name="property">
      <fields>
        <field name="id" type="enum item property" key="serial"/>
        <field name="property name" type="enum name"/>
        <field name="property value" type="enum item text"/>
        <field name="fixed fld" type="string"/>
      </fields>
      <config>
<!-- highlight-start -->
        <sql:enum-item-properties default="true"
             enum-name="enumeration" item-value="item code"
             property-name="property name" property-value="property value">
          <sql:fixed field-name="fixed fld" fixed-value="'some value'"/>
        </sql:enum-item-properties>
<!-- highlight-end -->
      </config>
    </object>
  </subobjects>
</object>
```

:::tip
If you configure such dictionary objects for existing database tables then, instead of manually defining those enumerations and their values in the model, you can initially import their data as model enumerations using the [Enumerations from Database](../model/enums.md) generator generator.

This will also configure the source objects for the imported enumerations as appropriate.
:::

## Generator outputs

This generator creates a single SQL file with a script that loads static enumerations and their merged items and properties into their target tables.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Enumeration Reload SQL|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Static Data|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|False|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../database/reload_enumerations.sql|Relative path where to output generated XML file with enumerations.|

### Model configuration

The generator doesn't use any other configuration parameters from the model.

### Common configurations

There expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only.

:::caution
You should always carefully review the generated script before running it, to make sure it doesn't cause any negative side effects.
:::

You can rerun the generator when you add or change enumeration items or properties.

:::note
This generator doesn't have to be included in the build of the model project in the configuration, and run only on as-needed basis instead, when you are ready to reload enumerations in the database.
:::

### Customizing the output

:::danger
You should never edit generated SQL directly to allow re-running the generator at any time without losing your changes.
:::

You should update the model as appropriate instead.

### Cleaning generator’s output

This generator does not support separate cleaning, since it always regenerates all enumerations when you rerun it.
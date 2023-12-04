---
sidebar_position: 3
---

# Enumerations from Database

Imports static enumerations into the Xomega model from an existing database, using the configuration of the Xomega objects that specifies the mapping between the object fields and enumeration structure.

For a generic dictionary type of object, this may import multiple enumerations, while for each table/object that stores items of a single enumeration, this will create an enumeration based on the object's name.

:::note
This generator is useful to import only static data into the Xomega model, which can change only from one release to another.

The benefit of maintaining the static data in the model is that it can be better version controlled, allows enhancements, such as extending one enumeration from another or adding more properties, and also allows the generation of other artifacts (such as constants) from it.
:::

## Generator inputs

The generator takes model objects that have a configuration of the mappings between object fields and enumeration structure, and imports enumeration data from their corresponding tables in the specified database into the model as Xomega enumerations.

### Object Enumeration Configuration

The objects that are set as a source of enumeration items for one or multiple enumerations must have a `sql:enum-items` element nested under their `config` element, which provides a mapping between the object fields and the enumeration structure. Specifically, it should set which of the object's fields store the value, text, and description of enumeration items in its attributes `item-value`, `item-text`, and `item-desc` respectively.

If the object represents a generic dictionary that contains items for multiple enumerations, then you must indicate which field stores the name of the enumeration in its `enum-name` attribute. You can also set the `default="true"` attribute on a generic dictionary, which will make it a source for any enumerations that don't have an explicitly configured `sql:enum-source` configuration.

For any other fields of the object, you should add nested `sql:property` elements to indicate which single-value property it maps to, or a `sql:fixed` element to set the field to a fixed value or a formula.

Similarly, objects that store multi-value properties of enumeration items, or properties of generic dictionaries for multiple enumerations, must have a `sql:enum-item-properties` element nested under their `config` element, specifying which of the object's fields store the item value, property name, and property value in its attributes `item-value`, `property-name`, and `property-value` respectively.

If the object is part of a generic dictionary that contains item properties for multiple enumerations, then you must indicate which field stores the name of the enumeration in its `enum-name` attribute. You can also set the `default="true"` attribute in this case, which will make it a source of properties for any enumerations that don't have an explicitly configured `sql:enum-source` configuration. For any other fields of the object, you can add nested `sql:fixed` element to set the field to a fixed value or a formula.

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

## Generator outputs

This generator creates single or multiple `.xom` files with enumerations, as defined by the *OutputPath* parameter, and adds them to the model project.

The generated enumerations will be automatically configured to point to their source objects so that you could easily generate a separate SQL script that reloads them in the database should you need to make any updates to them in the model, as follows.

```xml
<enums>
  <enum name="marital status">
    <item name="Single" value="S"/>
    <item name="Married" value="M"/>
    <config>
<!-- highlight-next-line -->
      <sql:enum-source items-object="dictionary" item-properties-object="dictionary.property"/>
    </config>
  </enum>
</enums>
```

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Enumerations from Database|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Model Enhancement|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|False|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|ImportedEnums/ {Module}_enums.xom|Relative path where to output generated .xom files with enumerations, which will be added to the model project. The path may contain \{Module/\} and \{File\} placeholders to output files by database schema and enumeration respectively.|
|**Database**|
|Database|SQL Server|Database type of the source database. Currently only SQL Server (`sqlsrv`) is supported. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Version|11.0|The version of the source database. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Case|CamelCase|The database case for the database objects' names: `UPPER_CASE`, `lower_case` or `CamelCase`. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Connection|Use Project Settings|Database connection string for the source database. Edited via a *Database Connection Configuration* dialog, which also sets the other Database parameters of the generator, and saving all this configuration for the entire project. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|

### Model configuration

The generator doesn't use any other configuration parameters from the model.

### Common configurations

There is expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only. Generally, you would run it only during the initial model import from the database.

This generator doesn't have to be included in the build of the model project in the configuration.

:::warning
If you rerun the generator to import additional enumerations after changing the configuration of the source objects, it may add enumerations with the same names as the previously imported enumerations, which would result in model validation errors. Therefore, it is better to copy the enumerations you need to other model files and delete the generated `.xom` files afterward to avoid such errors.
:::

### Customizing the output

You can edit imported enumerations in the model after you run the generator, but you will need to move them to separate files, to avoid losing your changes if you rerun the generator later on.

### Cleaning the generator’s output

This generator does not support the cleaning of the generated files.

:::tip
You may want to output the imported enumerations into a dedicated folder under the model project, and move the desired generated enumerations to files in a different folder so that it would be easy to delete the generated folder after that.
:::
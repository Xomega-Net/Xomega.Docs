---
sidebar_position: 3
---

# Database Schema

This generator helps you build a DDL script that creates a SQL Server database from your Xomega object model. It generates all the necessary tables, columns, primary keys, and foreign key relationships.

The generated script will be rerunnable and would not create the tables if they have already been created.

## Generator inputs

The generator uses objects and their fields defined in the model to create DB tables and columns.

It also leverages the structure of sub-objects, as well as the way key fields or fieldsets are set up, to infer the foreign key relationships between the tables, so that they wouldn't need to be defined explicitly.

### Tables and foreign keys

For primary objects (i.e. not sub-objects) with a single key field, the generated tables will have a set of columns based largely on the list of the object's fields.

Xomega model requires key fields to have dedicated types declared in the model. If such a key type (or any of its derived types) is used for a non-key field, or a field with a `key="reference"` attribute, then that field will be assumed to reference the object, for which this is a key type. In this case, the table will contain a foreign key to the referenced object's table.

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

If the object contains a field set in the list of fields, then the table will contain all fields from that field set as columns, using its fields' names prefixed with the name of the field set in the object, if set.

### Composite keys and subobjects

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

The key of the parent object is automatically included in all tables of its subobjects, and there will be a foreign key to the parent object's table generated on them. The generated foreign key to the parent table will have the *Delete* action set to `Cascade` since a subobject cannot exist without a parent object.

On top of that, if the key on the subobject is not "serial" (i.e. not unique), the parent object's key will be part of the subobject's primary key as well.

### SQL configurations

A lot of information that is needed to generate the database schema for the Xomega model will be derived directly from the model. By default, the names of the generated tables and columns will be based on the names of the corresponding objects and fields, using the specified DB naming case convention (i.e. `UPPER_CASE`, `lower_case`, or `CamelCase`).

The primary key is derived from the object's key, whether or not the column is required comes from the `required` attribute on the field, and the maximum length of the character columns is determined based on the `size` attribute of the field's type or its base types.

Any additional SQL-specific configuration is specified using a separate namespace `xmlns:sql="http://www.xomega.net/sql"`, as described below.

Each logical type used for the object fields should have a mapping to the corresponding SQL type on the `sql:type` element nested in the `config` element of either that type or any of its base types.

Any object field can have additional database configuration under its `sql:column` config element, where you can specify the column name to map it to (which allows you to easily rename object fields), SQL defaults, computed formulas, etc.

Any object can similarly have a `sql:table` config element, where you can specify the table name the object maps to.

You can also specify attributes of the foreign keys for the field in the `sql:foreign-key` config element, such as the foreign key name, as well as the `delete` and `update` actions. The implicit foreign key to the parent object is specified in the `sql:parent-foreign-key` element under the `sql:table` element.

The following example illustrates SQL configuration for the logical type `sales order detail`, and additional database options and parameters for the fields of the `details` subobject of the `sales order` object.

```xml
<types>
  <type name="sales order detail" base="integer key">
    <config>
<!-- highlight-next-line -->
      <sql:type name="bigint" db="sqlsrv" xmlns:sql="http://www.xomega.net/sql"/>
    </config>
  </type>
</types>
<objects>
  <object name="sales order">
    <fields>[...]
    <subobjects>
      <object name="detail">
        <fields>
          <field name="sales order detail id" type="sales order detail" key="serial" required="true"/>
          <field name="order qty" type="small int" required="true">
          <field name="unit price discount" type="money" required="true">
            <config>
<!-- highlight-next-line -->
              <sql:column name="UnitPriceDiscount" default="0.0"/>
            </config>
          </field>
          <field name="line total" type="line total" required="true">
            <config>
<!-- highlight-start -->
              <sql:column name="LineTotal"
                          computed="isnull([UnitPrice]*(1.0-[UnitPriceDiscount])*[OrderQty], 0.0)"/>
<!-- highlight-end -->
            </config>
          </field>
        </fields>
        <config>
<!-- highlight-start -->
          <sql:table name="Sales.SalesOrderDetail">
            <sql:parent-foreign-key delete="set null" update="set default"/>
          </sql:table>
<!-- highlight-end -->
        </config>
      </object>
    </subobjects>
  </object>
</objects>
```

## Generator outputs

This generator creates a rerunnable DDL script that creates tables for the model objects as needed.

:::note
A similar script can be generated from the Entity Data Model using standard Entity Framework tools.
:::

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Database Schema|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Data Layer|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|False|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../database/db_schema.sql|Relative path where to output the generated DDL script.|
|**Database**|
|Database|SQL Server|Database type for the DDL script. Currently only SQL Server (`sqlsrv`) is supported. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Version|11.0|The version of the database for the DDL script. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Case|CamelCase|The database case for the database objects' names: `UPPER_CASE`, `lower_case` or `CamelCase`. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|

### Model configuration

The generator doesn't use any other global configurations in the model.

### Common configurations

There is expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only. For that, you need to select it in the model project, and then select *Generate* menu from either the context menu or the top-level *Project* menu.

You can rerun the generator when you change any objects, fields, or types in the model, which may require re-running other generators that depend on the same model elements, such as the generator of [Service Implementations](../services/service-impl).

:::tip
Normally, you need to run it only initially, when you create your database, and then as needed, if you need a script to recreate the database structure for a new environment. You don't need to include this generator in the model build process.
:::

### Customizing the output

:::danger
You should never edit the generated DDL script directly to avoid losing your changes when you rerun the generator.
:::

The generator doesn't provide any additional customizations beyond what you can configure in the model or the generator parameters.

### Cleaning the generator’s output

The generator doesn't support cleaning the tables, since all tables are regenerated when you rerun the generator.

If you delete any objects in the model, you may need to manually delete the tables from your database or run the [Database Change Script](migration) generator.
---
sidebar_position: 2
---

# Enumeration Constants

Generates static C# constants for all enumerations, their items and properties declared in the Xomega model.

This allows using the generated constants in the code to refer to specific items, properties and enumerations, which provides compile-time validation of the code in cases when any of those get renamed or deleted.

## Generator inputs

For each static enumeration that is declared in the model using `enum` element, or dynamic enumeration that is defined by a `xfk:enum-cache` config element of a `read enum` operation, the generator will create a static C# class, which will contain a constant `EnumName` with the enumeration name, a nested class `Attributes` with constants for the names of enumeration properties, and a nested class `Parameters` with constants for the input parameters, as appropriate.

For static enumerations it will also contain string constants for enumeration items, which will be assigned to the item value. If enumeration inherits from another enumeration, the list of items will be merged with the base enumeration.

### Properties of static enumerations

Each enumeration allows declaring a list of additional properties that can be specified for each item on top of the standard name and value.

They are typically used to filter the list of items, or group them by certain properties. When stored in a lookup cache, the values for each item's properties are stored as additional named attributes on each record, so the generator creates constants for each property name to use in the code.

The following example illustrates how a `person type` enumeration has a single-value property `internal` declared, which defaults to `false`, and is set to `true` for the `Sales person` and `Employee` items.

```xml
<enums>
  <enum name="person type">
    <properties>
<!-- highlight-next-line -->
      <property name="internal" default="false" multi-value="false"/>
    </properties>
    <item name="Store contact" value="SC"/>
    <item name="Individual customer" value="IN"/>
    <item name="Sales person" value="SP">
<!-- highlight-next-line -->
      <prop ref="internal" value="true"/>
    </item>
    <item name="Employee" value="EM">
<!-- highlight-next-line -->
      <prop ref="internal" value="true"/>
    </item>
    <item name="Vendor contact" value="VC"/>
    <item name="General contact" value="GC"/>
  </enum>
</enums>
```

### Properties of dynamic enumerations

For dynamic enumerations that are based on a `read enum` operation, additional properties come from the output parameters that are not marked as `id-param` or `desc-param` on the `xfk:enum-cache` element, as demonstrated below for the output parameters `country region code` and `group`.

```xml
<object name="sales territory">
  <operations>
    <operation name="read enum">
      <output list="true">
        <param name="territory id"/>
        <param name="name"/>
<!-- highlight-start -->
        <param name="country region code"/>
        <param name="group"/>
<!-- highlight-end -->
      </output>
      <config>
<!-- highlight-next-line -->
        <xfk:enum-cache enum-name="sales territory" id-param="territory id" desc-param="name"
                        xmlns:xfk="http://www.xomega.net/framework"/>
      </config>
    </operation>
  </operations>
</object>
```

### Parameters of contextual enumerations

For dynamic enumerations based on a `read enum` operation that have input parameters, and their list of values is therefore dependent on the values of those parameters, constants for the names of such parameters will be generated in the `Parameters` class, so that they could be used with the local lookup cache loaders.

The following snippet shows such an enumeration with a `product id` input parameter.

```xml
<object name="special offer product">
  <operations>
    <operation name="read enum">
      <input>
<!-- highlight-next-line -->
        <param name="product id" type="product" required="true"/>
      </input>
      <output list="true">
        <param name="special offer id" type="special offer" required="true"/>
        <param name="description" type="string"/>
        <param name="discount" type="percent"/>
        <param name="active" type="boolean"/>
      </output>
      <config>
        <xfk:enum-cache enum-name="special offer product" id-param="special offer id"
                        desc-param="description" is-active-param="active"/>
      </config>
    </operation>
  </operations>
</object>
```

### Items of static enumeration

Enumeration items must have unique `name` and `value` attributes. The `value` is a short code or number that is stored internally in the system, and what the generated constant will be set to. The `name` is normally used to display the item to the user, and what the name of the constant is based on.

If the displayed text must be different from the name, e.g. when the generated constant would not be a valid identifier otherwise, then you can specify it in the `text` element inside the item, as follows.

```xml
<enums>
  <enum name="order status">
    <item name="New" value="0">
<!-- highlight-next-line -->
      <text>(New)</text>
    </item>
    <item name="In process" value="1"/>
    <item name="Approved" value="2"/>
    <item name="Rejected" value="3"/>
    <item name="Cancelled" value="4"/>
  </enum>
</enums>
```

### Enumeration inheritance

An enumeration can inherit from another enumeration, and add, remove, or replace items or their properties. This can be used to minimize duplication between enumerations that are similar, but with slight differences. The generated class for the enumeration will contain constants for combined/merged list of items.

The snippet below illustrates how the `sales order status` enumeration extends from the base `order status` enumeration, removes the `New` item, changes the value for the `Rejected` and `Cancelled` items, and adds new `Backordered` and `Shipped` items.

```xml
<enums>
  <enum name="sales order status" base="order status">
<!-- highlight-next-line -->
    <item name="New" overrideAction="delete"/>
    <item name="Backordered" value="3"/>
<!-- highlight-next-line -->
    <item name="Rejected" value="4"/>
    <item name="Shipped" value="5"/>
<!-- highlight-next-line -->
    <item name="Cancelled" value="6"/>
  </enum>
</enums>
```

## Generator outputs

This generator creates a single file with C# classes for all static and dynamic enumerations, which contain constants for the items, and nested classes with additional property names and input parameters, as appropriate.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Enumeration Constants|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Static Data|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Common /Enumerations/Enumerations.cs|Relative path where to output generated file with enumeration constants.|

### Model configuration

Parameters specified in the model configuration that are used by this generator consist of just the namespace for the classes that contain enumeration constants.

This is specified in the `xfk:enumerations-config` element under the top level `config` model element, which is conventionally placed in the `global_config.xom` file, as illustrated by the following snippet.

```xml title="global_config.xom"
<xfk:enumerations-config namespace="MySolution.Enumerations"/>
```

### Common configurations

There expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only.

You can rerun the generator when you add or change enumeration items or properties, or the `xfk:enum-cache` configuration of `read enum` operations, or if you change any parameters on those operations.

:::note
Normally, the latter will require re-running other generators that depend on the same model elements, such as generators of UI views, data objects, service and data contracts or the service implementations.

Therefore, this generator should be included in the build of the model project in the configuration, in order to allow to easily regenerate all enumeration constants along with other artifacts.
:::

### Customizing the output

:::danger
You should never edit generated classes or constants directly to allow re-running the generator at any time without losing your changes.
:::

You should update the model as appropriate instead.

### Cleaning generator’s output

This generator does not support separate cleaning, since it always regenerates all enumerations when you rerun it.
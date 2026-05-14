---
sidebar_position: 3
---

# Enumeration Data XML

Exports static enumerations defined in the Xomega model along with their items and properties to a simplified XML file, which can be packaged as an assembly resource, and used to load the enumeration data into the lookup cache in runtime using special `XmlLookupCacheLoader` from the Xomega Framework.

##  Generator inputs

The generator takes [non-abstract](../../modeling/static-data#abstract-enumerations) static enumerations declared in the model using `enum` element and outputs them into the specified XML file using the same format, as the one that is used in the model. If an enumeration inherits from another enumeration, the list of items will be merged with the base enumeration.

The snippet below illustrates how the `sales order status` enumeration extends from the base `order status` enumeration, removes the `New` item, changes the value for the `Rejected` and `Cancelled` items, and adds new `Backordered` and `Shipped` items.

```xml
<enums>
<!-- highlight-next-line -->
  <enum name="order status">
    <properties>
      <property name="closed" default="false" multi-value="false"/>
    </properties>
    <item name="New" value="0">
      <text>(New)</text>
    </item>
    <item name="In process" value="1"/>
    <item name="Approved" value="2"/>
    <item name="Rejected" value="3">
      <prop ref="closed" value="true"/>
    </item>
    <item name="Cancelled" value="4">
      <prop ref="closed" value="true"/>
    </item>
  </enum>
<!-- highlight-next-line -->
  <enum name="sales order status" base="order status">
    <item name="New" overrideAction="delete"/>
    <item name="Backordered" value="3"/>
    <item name="Rejected" value="4"/>
    <item name="Shipped" value="5">
      <prop ref="closed" value="true"/>
    </item>
    <item name="Cancelled" value="6"/>
  </enum>
</enums>
```

## Generator outputs

This generator creates a single XML file with all static enumerations and their merged items and properties using the Xomega model format.

## Configuration

By default, the generator configuration is defined under the `.Generators\Static Data` folder in the model project as follows.

```xml title="Enumeration Data XML.xgen"
<XomGeneratorConfig xmlns="http://schemas.xomega.net/v10/xgen"
                    xmlns:res="http://schemas.xomega.net/v10/xgen/resources">

  <Generator Xsl="Enums/xml_resources.xsl"
             IncludeInBuild="true"/>

  <res:Output Path="../MySolution.Services.Common/Enumerations/enumerations.xres"/>

</XomGeneratorConfig>
```

### Generator parameters

The following table describes configuration parameters for the generator.

|Parameter|Value Example|Description|
|-|-|-|
|Xsl|Enums/xml_resources.xsl|Relative path to the XSLT file used by the generator to generate the enumeration XML.|
|IncludeInBuild|true|A flag indicating whether or not running this generator should be included in building of the model project.|
|**res:Output**|
|Path|../MySolution.Services.Common /Enumerations/enumerations.xres|Relative path where to output generated XML file with enumerations.|

### Model configuration

The generator doesn't use any other configuration parameters from the model.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only.

You can rerun the generator when you add or change enumeration items or properties.

:::note
This generator can be included in the build of the model project in the configuration, to allow easy regeneration of all enumeration constants along with other artifacts.
:::

### Customizing the output

:::danger
You should never edit generated XML directly to allow re-running the generator at any time without losing your changes.
:::

You should update the model as appropriate instead.

###  Cleaning generator’s output

This generator does not support separate cleaning, since it always regenerates all enumerations when you rerun it.
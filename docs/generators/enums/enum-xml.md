---
sidebar_position: 3
---

# Enumeration Data XML

Exports static enumerations defined in the Xomega model along with their items and properties to a simplified XML file, which can be packaged as an assembly resource, and used to load the enumeration data into the lookup cache in runtime using special `XmlLookupCacheLoader` from the Xomega Framework.

##  Generator inputs

The generator takes static enumerations declared in the model using `enum` element and outputs them into the specified XML file using the same format, as the one that is used in the model. If an enumeration inherits from another enumeration, the list of items will be merged with the base enumeration.

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

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Enumeration Data XML|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Static Data|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Common /Enumerations/enumerations.xml|Relative path where to output generated XML file with enumerations.|

### Model configuration

The generator doesn't use any other configuration parameters from the model.

### Common configurations

There is expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

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
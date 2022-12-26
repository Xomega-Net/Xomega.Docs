---
sidebar_position: 3
---

# Static Data Design

This generator creates a professional Microsoft Word design document that describes the static data architecture used by the system, as well as the full structure and documentation of all enumerations and their items grouped by module.

The generated document is based on a customizable Word template that you can update to change the look-and-feel, the static content, and even the way dynamic content is added.

:::tip
This can save you countless hours on developing and maintaining high-quality design documentation and will allow you to be more agile by sharing the design with other stakeholders at any point.

Plus, you'll never have to worry about the technical design being out of sync with the actual implementation.
:::tip

## Generator inputs

For each enumeration defined in the model, grouped by module, the generated design document lists its properties and items, along with their detailed descriptions.

In addition to the explicit documentation provided in the model for the enumeration and each item or property under their `doc` elements, the generator also uses other information from the model to create comprehensive documentation on each item or property.

The following example illustrates the structure of the `doc` element for different model elements. It contains a `summary` tag, which briefly describes the item, the property, or the enumeration, and can also be output in the comments of generated code, followed by any additional free text documentation on those.

```xml
<enums>
  <enum name="person type">
    <properties>
      <property name="internal" default="false" multi-value="false">
<!-- highlight-start -->
        <doc>
          <summary>Indicates if a person is internal or external to the company.</summary>
          [Here goes any additional documentation on the "internal" property of enumeration items.]
        </doc>
<!-- highlight-end -->
      </property>
    </properties>
    <item name="Store contact" value="SC"/>
    <item name="Individual customer" value="IN"/>
    <item name="Sales person" value="SP">
      <prop ref="internal" value="true"/>
<!-- highlight-start -->
      <doc>
        <summary>Internal employee responsible for sales.</summary>
        [Here goes any additional documentation on the "Sales person" item.]
      </doc>
<!-- highlight-end -->
    </item>
    <item name="Employee" value="EM">
      <prop ref="internal" value="true"/>
    </item>
    <item name="Vendor contact" value="VC"/>
    <item name="General contact" value="GC"/>
<!-- highlight-start -->
    <doc>
      <summary>List of internal and external types of persons in the system.</summary>
      [Here goes any additional documentation on the "person type" enumeration.]
    </doc>
<!-- highlight-end -->
  </enum>
</enums>
```

The generated documentation of each item will also contain the values of each of its additional properties.

## Generator outputs

This generator creates a Microsoft Word static data design document at the specified path, which then needs to be updated to refresh the table of contents and any other calculated fields.

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Static Data Design|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Documentation|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|False|A flag indicating whether or not running this generator should be included in building of the model project.|
|Document Template|C:\Program Files (x86)\Xomega.Net\8.11\ Templates\StaticData.docx|Path to the MS Word document that will be used as a template for the generated document.|
|**Output**|
|Output Path|../Docs/StaticDataDesign.docx|Relative path where to output the generated document.|
|**Parameters**|
|Title|MySolution's Static Data Design|Title to use for the generated document.|
|Subject|Technical design for the MySolution's static data|Subject (subtitle) to use for the generated document.|
|Creator|[User]|Creator (author) of the generated document. Value `[User]` indicates the user of the current Xomega license.|
|Company|[Company]|Company to use for the generated document. Value `[Company]` indicates the company of the current Xomega license.|

### Model configuration

The generator doesn't use any other global configurations in the model.

### Common configurations

There is expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only. For that, you need to select it in the model project, and then select *Generate* menu from either the context menu or the top-level *Project* menu.

:::caution
After you generate the document, you need to open it and refresh all fields there, such as the table of contents, by selecting all text (Ctrl+A) and pressing F9.
:::

You can rerun the generator when you add or change enumeration items or properties, the `xfk:enum-cache` configuration of `read enum` operations, or if you change any parameters on those operations.

:::tip
Normally, you need to run it initially, during the design of the system, and then as needed, to generate up-to-date documentation. You don't need to include this generator in the model build process.
:::

### Customizing the output

:::danger
You should never edit the generated document directly to avoid losing your changes when you rerun the generator.
:::

Instead, you should update the MS Word template that is used to create the document or make changes in the model itself.

### Cleaning the generator’s output

The generator doesn't support a *Clean* operation, since the entire document is regenerated when you rerun the generator.
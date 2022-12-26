---
sidebar_position: 1
---

# Domain Model Design

This generator creates a professional Microsoft Word design document that describes the general domain architecture used by the system, as well as the full structure and documentation of all domain objects and their fields grouped by module.

The generated document is based on a customizable Word template that you can update to change the look-and-feel, the static content, and even the way dynamic content is added.

:::tip
This can save you countless hours on developing and maintaining high-quality design documentation and will allow you to be more agile by sharing the design with other stakeholders at any point.

Plus, you'll never have to worry about the technical design being out of sync with the actual implementation.
:::

##  Generator inputs

For each object defined in the model, grouped by module, the generated design document lists its key and non-key fields, along with detailed descriptions of each field and of the object itself.

In addition to the explicit documentation provided in the model for the object and each field under their `doc` elements, the generator also uses information from the field's type, required attributes, implicit references to other objects, as well as allowed values from static enumerations defined in the model, to create comprehensive documentation on each field.

The following example illustrates the structure of the `doc` element for different model elements. It contains a `summary` tag, which briefly describes the field or the object, and can also be output in the comments of generated code, followed by any additional free text documentation on those.

```xml
<types>
  <type name="sales order" base="integer key"/>
  <type name="sales order status" base="tiny int enumeration">
<!-- highlight-next-line -->
    <enum ref="sales order status"/>
  </type>
</types>
<enums>
<!-- highlight-next-line -->
  <enum name="sales order status">
    <item name="In process" value="1"/>
    <item name="Approved" value="2"/>
    <item name="Backordered" value="3"/>
    <item name="Rejected" value="4"/>
    <item name="Shipped" value="5"/>
    <item name="Cancelled" value="6"/>
  </enum>
</enums>
<objects>
  <object name="sales order">
    <fields>
      <field name="sales order id" type="sales order" key="serial" required="true"/>
      <field name="order date" type="date time" required="true"/>
<!-- highlight-next-line -->
      <field name="status" type="sales order status" required="true">
        <doc>
<!-- highlight-start -->
          <summary>Order current status.</summary>
          [Here goes any additional documentation on the "status" field. No need to describe
           the list of possible values here, as it will be derived from the corresponding enumeration.]
<!-- highlight-end -->
        </doc>
      </field>
    </fields>
  </object>
  <doc>
<!-- highlight-start -->
    <summary>General sales order information.</summary>
    [Here goes any additional documentation on the "sales order" object.]
<!-- highlight-end -->
  </doc>
</objects>
```

The fact that the `sales order status` field here is linked to a defined enumeration allows listing all the possible values with their meaning right in the documentation for that field, which makes it easier for the readers to understand the design for that field.

## Generator outputs

This generator creates a Microsoft Word domain design document at the specified path, which then needs to be updated to refresh the table of contents and any other calculated fields.

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Domain Model|Design	The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Documentation|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|False|A flag indicating whether or not running this generator should be included in building of the model project.|
|Document Template|C:\Program Files (x86)\Xomega.Net\8.11\ Templates\DomainModel.docx|Path to the MS Word document that will be used as a template for the generated document.|
|**Output**|
|Output Path|../Docs/DomainModelDesign.docx|Relative path where to output the generated document.|
|**Parameters**|
|Title|MySolution's Domain Model|Title to use for the generated document.|
|Subject|Technical design for the MySolution's domain model|Subject (subtitle) to use for the generated document.|
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

You can rerun the generator when you change any objects, fields, or types in the model, which may require re-running other generators that depend on the same model elements, such as generators of service implementations.

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
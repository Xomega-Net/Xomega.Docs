---
sidebar_position: 2
---

# Service Model Design

This generator creates a professional Microsoft Word design document that describes the general service architecture used by the system, as well as full structure and documentation of all services with their input and output structures grouped by module.

The generated document is based on a customizable Word template that you can update to change the look and feel, the static content, and even the way dynamic content is added.

:::tip
This can save you countless hours on developing and maintaining high quality design documentation, and will allow you to be more agile by sharing the design with other stakeholders at any point.

Plus, you'll never have to worry about the technical design being out of sync with the actual implementation.
:::

## Generator inputs

For each service operation defined in the model, the generated design document lists its input and output structures with detailed descriptions of each parameter, all grouped by module and service (object).

In addition to the explicit documentation provided in the model for the service, operation and each parameter under their `doc` elements respectively, the generator also uses information from the parameter's type, required attributes, corresponding object field, as well as allowed values from static enumerations defined in the model, to create comprehensive documentation on each parameter.

The following example illustrates the structure of the `doc` element for different model elements. It contains a `summary` tag, which briefly describes the parameter, structure, operation or the service, and can also be output in the comments of generated code, followed by any additional free text documentation on those.

```xml
<objects>
  <object name="sales order">
    <fields>...</fields>
    <operations>
      <operation name="create" type="create">...</operation>
      <operation name="read" type="read">...</operation>
      <operation name="update" type="update">
        <input>
          <param name="sales order id">
<!-- highlight-start -->
            <doc>
              <summary>Id of the sales order to update.</summary>
              [Here goes any additional documentation on the "sales order Id" input parameter.]
            </doc>
<!-- highlight-end -->
          </param>
          <struct name="data">
            <param name="status"/>
            <param name="purchase order number"/>
            <struct name="customer" ref="customer update"/>
            <struct name="payment" ref="payment update"/>
            <param name="comment"/>
<!-- highlight-start -->
            <doc>
              <summary>Order data to set.</summary>
              [Here goes any additional documentation on the "data" input structure.]
            </doc>
<!-- highlight-end -->
          </struct>
        </input>
<!-- highlight-start -->
        <doc>
          <summary>Updates data of a specific sales order.</summary>
          [Here goes any additional documentation on the "update" operation of the sales order service.]
        </doc>
<!-- highlight-end -->
      </operation>
      <operation name="delete" type="delete">...</operation>
      <operation name="read list" type="readlist">...</operation>
<!-- highlight-start -->
      <doc>
        <summary>A service for managing sales orders.</summary>
        [Here goes any additional documentation on the "sales order" service.]
      </doc>
<!-- highlight-end -->
    </operations>
  </object>
</objects>
```

If a parameter has no documentation, but has a corresponding field defined on the object, then the documentation of that field will be output in the document, which saves you from documenting standard parameters unless you need to.

Also, if the type of the parameter is associated with an enumeration, then the output will contain the list of possible values with their meaning for that parameter, which makes it easier for the readers to understand the design for that parameter.

## Generator outputs

This generator creates a Microsoft Word service model design document at the specified path, which then needs to be updated to refresh the table of contents and any other calculated fields.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Service Model Design|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Documentation|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|False|A flag indicating whether or not running this generator should be included in building of the model project.|
|Document Template|C:\Program Files (x86)\Xomega.Net\8.11\ Templates\ServiceModel.docx|Path to the MS Word document that will be used as a template for the generated document.|
|**Output**|
|Output Path|../Docs/ServiceModelDesign.docx|Relative path where to output the generated document.|
|**Parameters**|
|Title|MySolution's Service Model|Title to use for the generated document.|
|Subject|Technical design for the MySolution's service model|Subject (subtitle) to use for the generated document.|
|Creator|[User]|Creator (author) of the generated document. Value `[User]` indicates the user of the current Xomega license.|
|Company|[Company]|Company to use for the generated document. Value `[Company]` indicates the company of the current Xomega license.|

### Model configuration

The generator doesn't use any other global configurations in the model.

### Common configurations

There expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only. For that you need to select it in the model project, and then select *Generate* menu from either the context menu or the top-level *Project* menu.

:::caution
After you generate the document, you need to open it and refresh all fields there, such as the table of contents, by selecting all text (Ctrl+A) and pressing F9.
:::

You can rerun the generator when you add or change object operations or structures in the model, which will require re-running other generators that depend on the same model elements, such as generators of UI views, data objects as well as service implementations. 

:::tip
Normally, you need to run it initially, during the design of the system, and then as needed, to generate up-to-date documentation. You don't need to include this generator into the model build process.
:::

### Customizing the output

:::danger
You should never edit the generated document directly to avoid losing your changes when you rerun the generator.
:::

Instead, you should update the MS Word template that is used to create the document, or make changes in the model itself.

### Cleaning generator’s output

The generator doesn't support a *Clean* operation, since the entire document is regenerated when you rerun the generator.
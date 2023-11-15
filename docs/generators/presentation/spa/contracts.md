---
sidebar_position: 3
---

# TS Service Contracts

Generates TypeScript structures for input and output data contracts for REST services, as well as methods for all REST operations on an object or its subobjects that help you to easily call those operations in a structured manner using JQuery Ajax API.

## Generator inputs

Any object in the Xomega model that has operations, or subobjects with operations, represents a service. Configuration of such operations and any supporting structures in the model is used to generate the service and data contracts.

### Operations

For each REST service, there will be a TypeScript class generated based on the object name, starting with "I", and ending with "Service", e.g. `ISalesOrderService`.

For each service operation that is exposed via REST, i.e. has a `rest:method` configuration, this class will contain a method starting with "get", followed by the operation's fully qualified name, and ending with "Request", e.g. `getUpdateRequest(...)` which will take input arguments either as individual parameters, or as structures, and will construct an instance of `JQueryAjaxSettings` class with proper URL and body parameters, which can be used to invoke the REST operation asynchronously.

For the input and output structures, as well as any inline structures nested within those, there will be generated a dedicated structure with a fully qualified name. For example, for the inline structure `data` nested inside the `input` of the sales order's `update` operation that is shown below, the name of the generated structure will be `SalesOrder_UpdateInput_Data`.

```xml
<objects>
<!-- highlight-next-line -->
  <object name="sales order">
    <fields>[...]
    <operations>
      <operation name="create" type="create">...</operation>
      <operation name="read" type="read">...</operation>
<!-- highlight-next-line -->
      <operation name="update" type="update">
        <input>
          <param name="sales order id"/>
<!-- highlight-next-line -->
          <struct name="data">
            <param name="status"/>
            <param name="purchase order number"/>
            <struct name="customer" ref="customer update"/>
            <struct name="payment" ref="payment update"/>
            <param name="comment"/>
          </struct>
        </input>
        <config>
<!-- highlight-next-line -->
          <rest:method verb="PUT" uri-template="sales-order/{sales order id}"
                       xmlns:rest="http://www.xomega.net/rest"/>
        </config>
      </operation>
      <operation name="delete" type="delete">...</operation>
      <operation name="read list" type="readlist">...</operation>
    </operations>
  </object>
</objects>
```

### Structures

Instead of inline structures defined directly inside the service operations, you can just reference a named structure that is defined globally in the model.

For example, the `customer update` and `payment update` structures that are referenced in the previous example can be defined under the `structs` top-level element in the model as follows.

```xml
<structs>
<!-- highlight-next-line -->
  <struct name="customer update" object="customer">
    <param name="customer id"/>
    <struct name="billing address" ref="address key"/>
    <struct name="shipping address" ref="address key"/>
  </struct>
<!-- highlight-next-line -->
  <struct name="payment update" object="sales order">
    <param name="ship method id"/>
    <param name="due date" type="date"/>
    <struct name="credit card">
      <param name="credit card id" required="true"/>
      <param name="credit card approval code"/>
    </struct>
  </struct>
</structs>
```

The name of the generated class will be based on the name of the structure, e.g. `CustomerUpdate`, which should be unique.

:::note
The standalone structures can in turn have parameters referencing other standalone structures or can have other inline structures nested inside of them, which will be also generated using their fully qualified name.
:::

### TypeScript types

The primitive properties on the generated structures will be of type any, so there is no need to map logical types in the model to the TypeScript types.

:::caution
This will NOT allow the TypeScript compiler to check the type of the arguments that you pass to the input structures or assign from the output structures, but it will provide you with IntelliSense and compiler checks of the names for input and output parameters used, which is more important.
:::

:::note
Standard CRUD and `read list` operations for an object can be easily added automatically to the model by a special [model enhancement CRUD generator](../../model/crud).
:::

## Generator outputs

This generator creates TypeScript classes for service and data contracts, which can be placed in separate files by service, grouped by module, or output to a single file, depending on how you set up your `tsOutputPath` model configuration attribute for services.

The standalone structures will be output in a separate file by module with a "*Structures*" postfix. The generated classes will be added to the specified project, which is usually a dedicated project for the SPA client.

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|TS Service Contracts|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Presentation Layer\SPA|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Add To Project|../MySolution.Services.Spa /MySolution.Services.Spa.csproj|Relative path to the project file to add the generated files to. The project will be reloaded every time you run the generator. Leave it blank if you don't want generated files to be added to your project automatically.|

### Model configuration

The generator's configuration parameters that need to be also accessible to other generators are specified in the Xomega model in the `svc:services-config` element under the top-level `config` element, which is conventionally placed in the `global_config.xom` file.

These parameters include the output path for the generated TypeScript files, which may contain {Module} and \{File\} placeholders to output them by module and service, as shown below.

```xml title="global_config.xom"
<svc:services-config tsOutputPath="../MySolution.Client.Spa/ServiceContracts/\{Module/\}\{File\}"/>
```

:::note
Note that this is different from most of the other generators, which specify the output paths as generator parameters rather than in the model configuration.
:::

To be able to use the generated classes in other TypeScript files requires importing the file where the generated class is declared using a relative path to it, so the other generators that use services, such as Data Objects, also need to know the path to them.

### Common configurations

There is expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator either for the entire model or for individual files by selecting them in the model project and running the generator from the context menu.

You can rerun the generator when you add or change object operations or structures in the model, which will require re-running other generators that depend on the same model elements, such as generators of UI views, data objects as well as service implementations. 

:::note
Therefore, this generator should be included in the build of the model project in the configuration, to allow you to easily regenerate all service and data contracts along with other artifacts.
:::

### Customizing the output

:::danger
You should never edit generated service and data contracts directly. This allows re-running the generator at any time without losing your customizations.
:::

You should update the model as appropriate to customize the generated classes.

### Cleaning the generator’s output

This generator supports cleaning either all generated service contracts or only the ones from the selected model files using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the services from the model, and want the generated classes deleted and removed from the target project.
:::
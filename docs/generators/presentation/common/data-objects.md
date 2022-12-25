---
sidebar_position: 1
---

# Xomega Data Objects

Generates customizable presentation layer data objects that are used as data models for UI View Models.

The generated data objects are C# classes based on Xomega Framework, which can be reused in different types of C# clients, such as WebForms or WPF.

You can add your customizations to a subclass of a generated data object, and implement any reusable platform-independent presentation logic there, such as custom validations, propagations and updates based on property change events, custom invocation and handling of service operations including serialization to/from data contracts, etc.

## Generator inputs

The generator uses data object definitions in the Xomega model in order to generate the corresponding C# classes. Those definition consist of a data object declaration in the model, and a number of usage references in each model structure associated with the data object.

### Data Objects

In the declaration element you give data object a unique class name, and optionally specify if this is a `list` object, and whether you need to `customize` it as illustrated below.

```xml
<!-- highlight-next-line -->
<xfk:data-object class="SalesOrderList" list="true" customize="true"
                 xmlns:xfk="http://www.xomega.net/framework"/>
```

You can also add named child objects from the model to your data object declaration here using nested `xfk:add-child` elements, as follows.

```xml
<xfk:data-object class="SalesOrderObject" customize="true">
<!-- highlight-start -->
  <xfk:add-child name="customer" class="SalesOrderCustomerObject"/>
  <xfk:add-child name="detail" class="SalesOrderDetailList"/>
<!-- highlight-end -->
</xfk:data-object>
```

### Operations

Once you declare a data object, you will need to add references to that object in the `input`, `output` or standalone structures declared in the model, by adding corresponding `xfk:add-to-object` element under the structure’s `config` element as shown below.

```xml
<operation name="read list" type="readlist">
  <input>...</input>
  <output list="true">
    <param name="sales order id"/>
    <param name="sales order number"/>
    <param name="status"/>
    <param name="order date" type="date"/>
    <param name="total due"/>
    <config>
<!-- highlight-next-line -->
      <xfk:add-to-object class="SalesOrderList"/>
    </config>
  </output>
</operation>
```

These references from the model structures will serve a dual purpose.

On the one hand, all parameters from these structures combined will form a set of data properties for the data object, which will be grouped by parameter name, so it’s important that parameters with the same name have the same type in different structures.

On the other hand, the operations that those structures participate in as input or output will determine which service call methods will be generated on those data objects, and whether the object’s properties will feed into the input and/or will be populated from the output of those service calls.

:::tip
Oftentimes, input structures for REST-compliant operations will consist of some key fields (which will go into the URL parameters), and the actual data in a separate child structure (which will go into the body of the request).

In such cases, it is important to add both the main input structure, and the child structure to the data object, to ensure that the service call method is generated correctly on the data object.
:::

### Properties

The Xomega Framework data properties that are used on the generated data objects are determined based on the configuration of their types in the model. The types usually inherit such configurations from their base types, but can override the data properties to use as needed.

You need to specify the property `class` and `namespace` on the `xfk:property` element under the `config` element of the type, as follows.

```xml
<type name="date time">
  <config>
<!-- highlight-next-line -->
    <xfk:property class="DateTimeProperty" namespace="Xomega.Framework.Properties"/>
  </config>
</type>
<type name="string">
  <config>
<!-- highlight-next-line -->
    <xfk:property class="TextProperty" namespace="Xomega.Framework.Properties"/>
  </config>
</type>
```

:::note
Most of this setup of data objects in the model for standard CRUD and `Read List` operations can be easily added automatically to the model by a special [model enhancement CRUD generator](../../model/crud).
:::

## Generator outputs

This generator creates C# classes for Xomega Framework-based data objects with all the data properties, child objects and service call methods defined, as well as a static class for registering these data objects for Dependency Injection (DI) with the service container.

For data objects that are decorated with a `customize="true"` attribute, it also creates a subclass of the generated object with a postfix *Customized* appended to the class name, if one does not exist yet, and will use this name for DI registration.

The customized classes will be nested under the corresponding generated data object class, according to the rules specified in the `.filenesting.json` file for the target client project.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Xomega Data Objects|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Presentation Layer\Common|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Client.Common /DataObjects/{Module/}{File}.cs|Relative path where to output files with generated Xomega Data Objects. The path may contain {Module/} and {File} placeholders to output files by module and data object respectively.|
|Custom Path||Relative path where to output override classes for the generated Xomega Data Objects. If not set, then the *OutputPath* will be used. The path must contain a {File} placeholder to output files by data object.|
|Registry File|../MySolution.Client.Common /DataObjects/DataObjects.cs|Relative path to the file for data object registration with the DI service container. The registration extension method will be derived from the file name.|

### Model configuration

Configuration parameters for the generator that need to be also accessible to other generators are specified in the Xomega model in the `xfk:data-objects-config` element under the top level `config` element, which is conventionally placed in the `global_config.xom` file.

These parameters include the `namespace` for the generated data objects, and their `assembly` based on the project name that they will be added to. The snippet below illustrates such a configuration.

```xml title="global_config.xom"
<xfk:data-objects-config namespace="MySolution.Client.Objects"
                         assembly="MySolution.Client.Common" />
```

### Common configurations

There expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator either for the entire model, or for individual files by selecting them in the model project, and running the generator from the context menu.

You can rerun the generator when you add new data objects or change existing data objects in the model, and also when you change the structure of operations that the data objects are associated with.

:::note
Normally, this will require re-running other generators that depend on the same model elements, such as generators of UI views or service and data contracts as well as the service implementations. Therefore, this generator should be included in the build of the model project in the configuration, in order to allow to easily regenerate all data objects along with other artifacts.
:::

### Customizing the output

:::danger
You should never edit generated data objects or registration classes directly. This allows re-running the generator at any time without losing your customizations.
:::

To add your customizations, you should edit a subclass of the generated data object class that was added when you specified the `customize` attribute on the data object.

:::note
You can also add your own custom subclass of the generated data object in your project, but then you will need to make sure to register that class with the dependency injection service container after the generated data objects are registered.
:::

### Cleaning generator’s output

This generator supports cleaning either all generated data objects, or only the ones from the selected model files using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the data objects from the model, and want the generated classes deleted and removed from the target project.
:::

:::caution
The customization subclasses that were generated for data objects with a `customize="true"` attribute will not be cleaned during these operations to prevent any loss of custom code during accidental run of such actions. Therefore, you may get compilation errors for those classes if you clean your data objects, and will need to delete them manually as needed.
:::
---
sidebar_position: 2
---

# Service Implementations

Generates customizable C# service implementation classes for the services defined in the model, using Xomega Framework and LINQ over the Entity Framework domain objects that are generated from the model separately.

The generated implementations may require little to no customizations for standard CRUD or `ReadList` methods, or more heavy customizations, if the operation's structure is not standard, or if it uses a lot of custom parameters.

You have several different options for writing custom code for the generated service implementations, from inserting the custom code inline, to providing it in a partial class or a subclass.

## Generator inputs

The generator uses the `type` attribute on the operation, as well as the structure of its input and output parameters to create implementation of the service operations.

For any parameters that have a corresponding field on the object with the same name, the implementation will either use it to look up the object, if it's a key input parameter, store parameter's value on the entity, if it's a non-key input parameter, or set it from the corresponding field, if this is an output parameter.

If there is no object field for the given parameter, the generator will output a special commented `TODO` placeholder that allows you to provide inline custom code right in the generated method.

:::note
If the type of the operation cannot be determined, the generator may output an implementation with no real logic, which you can override in a subclass to provide your own implementation.
:::

### CRUD operations

The standard `Create`, `Read`, `Update` and `Delete` operations, which the generator handles the best, use the appropriate type attribute, and have the key field(s) as output or input parameters as needed.

The following snippet illustrates the structure of the typical CRUD operations on an object with a serial auto-generated key.

```xml
<object name="sales order">
  <fields>...</fields>
  <operations>
<!-- highlight-next-line -->
    <operation name="create" type="create">
      <input arg="data">[...]
      <output>
        <param name="sales order id"/>
      </output>
    </operation>
<!-- highlight-next-line -->
    <operation name="read" type="read">
      <input>
        <param name="sales order id"/>
      </input>
      <output>[...]
    </operation>
<!-- highlight-next-line -->
    <operation name="update" type="update">
      <input>
        <param name="sales order id"/>
        <struct name="data">[...]
      </input>
    </operation>
<!-- highlight-next-line -->
    <operation name="delete" type="delete">
      <input>
        <param name="sales order id"/>
      </input>
    </operation>
  </operations>
</object>
```

### ReadList operation

An operation to read a list of objects will have the `type="readlist"` attribute, a `list="true"` attribute on the `output` structure, as well as some input parameters as the criteria.

For reading a list of child subobjects, the input parameters may be just the key(s) of the parent object.

An operation to read a list of primary objects will typically have a special `criteria` structure that contains the fields to filter by, an optional comparison operator parameter for each field, whose name consists of the field name and a postfix " operator", and possibly a second parameter for the field to allow supplying a range for the `BETWEEN` operator, as follows.

```xml
<object name="sales order">
  <operations>
<!-- highlight-next-line -->
    <operation name="read list" type="readlist">
      <input>
<!-- highlight-next-line -->
        <struct name="criteria">
          <param name="sales order number operator" type="operator"/>
          <param name="sales order number" required="false"/>
          <param name="status operator" type="operator"/>
          <param name="status" required="false" list="true"/>
          <param name="order date operator" type="operator"/>
          <param name="order date" type="date" required="false"/>
          <param name="order date2" type="date" required="false"/>
        </struct>
      </input>
<!-- highlight-next-line -->
      <output list="true">[...]
    </operation>
  </operations>
</object>
```

:::note
Standard CRUD and `ReadList` operations for an object can be easily added automatically to the model by a special [model enhancement CRUD generator](../model/crud.md).
:::

## Generator outputs

This generator creates service implementation C# classes, as well as a static class for registering them for Dependency Injection (DI) with the service container, under the specified path for the server-side project.

For services that have customization configuration in the `svc:customize` element under the object's `config` element, with attributes `subclass` or `extend` set to `true`, the generator also creates separate files with a subclass and/or partial class of the generated service implementation, whose names end with *Customized* or *Extended* respectively, if such files don't exist yet.

It will also use the name of the customized subclass for DI registration to ensure that the subclass is used as the service implementation.

The customized and extended classes will be nested under the corresponding generated service implementation class, according to the rules specified in the `.filenesting.json` file for the target services project.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Service Implementations|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Service Layer|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Entities /Services/{Module/}{File}.cs|Relative path where to output files with generated service implementations. The path may contain {Module/} and {File} placeholders to output files by module and service respectively.|
|Custom Path||Relative path where to output override classes for the generated service implementations. If not set, then the *OutputPath* will be used. The path must contain a {File} placeholder to output files by service.|
|Registry File|../MySolution.Services.Entities /Services/Services.cs|Relative path to the file for service implementations registration with the DI service container. The registration extension method will be derived from the file name.|

### Model configuration

Configuration parameters for the generator that need to be also accessible to other generators are specified in the Xomega model in the `svc:services-config` element under the top level `config` element, which is conventionally placed in the `global_config.xom` file.

These parameters include the namespace for the generated classes, as shown below.

```xml title="global_config.xom"
<svc:services-config implNamespace="MySolution.Services.Entities" />
```

### Common configurations

There expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator either for the entire model, or for individual files by selecting them in the model project, and running the generator from the context menu.

You can rerun the generator when you change the structure of operations or the related configuration. Normally, this will require re-running other generators that depend on the same model elements, such as generators of service and data contracts, UI views and data objects.

Therefore, this generator should be included in the build of the model project in the configuration, in order to allow to easily regenerate all service implementations along with other artifacts.

### Customizing the output

The generated service implementation classes allow you to intermingle your custom code with the generated code both to provide implementation for the parameters that the generator doesn't know how to handle, and to add custom behavior to the implementation.

For this, the generated code will contain special placeholders starting with a commented `CUSTOM_CODE_START` marker followed by the marker text explaining the intended purpose of the custom code, and ending with a `CUSTOM_CODE_END` marker, as follows.

```cs
// highlight-next-line
// CUSTOM_CODE_START: add code for SalesOrderId criteria of Detail_ReadList operation below
if (_salesOrderId != null)
{
    // TODO: src = src.Where(o => _salesOrderId == _salesOrderId);
// highlight-next-line
} // CUSTOM_CODE_END
```

The custom code placeholders for the pieces that the generator doesn't know how to handle properly will have a special `TODO` tag, in order to allow you to find all such places easily, and provide the necessary implementations.

:::caution
To make sure that your custom code is preserved during subsequent generator runs, you need to always place it in between the designated markers, and also make sure that the marker text in the comment doesn't change from one run to another, since it's used as an identifier of each custom code.
:::

The marker text usually contains the name of the method, as well as the name of the parameter to be handled, if appropriate. This means that renaming a parameter or an operation may result in a loss of the custom code, so you need to be careful when doing that.

:::tip
If you do need to rename the custom parameters or their operation in the model, make sure you make a copy of your custom implementation, or, better yet, **version control your code**, so that you could see any differences in the generated code after you rerun the generator.
:::

Normally, you want to minimize the amount of custom code that you provide inline, mixed in with the generated code. To achieve that, you can add a partial class for the generated service implementation, add to it some custom methods that take any input arguments as the context and return the needed results, and then call those methods from the inline custom code. This way your custom code will be mostly contained in a separate file that you can easily view and keep safe.

The generator can help you create such a partial class if you add a `svc:customize` element to the object's `config` element, and set the `extend="true"` attribute on it, as illustrated below.

```xml
<object name="sales order">
  <operations>[...]
  <config>
<!-- highlight-next-line -->
    <svc:customize extend="true" subclass="true"/>
  </config>
</object>
```

Additionally, you can set `subclass="true"` attribute on the `svc:customize` element, and the generator will also create a subclass of the generated service implementation class, where you can override any operation, and it will use the customized subclass for the DI registration.

:::note
You can also add your own custom subclass or partial class of the generated service implementation in your project, but then you will need to make sure to register that subclass with the dependency injection service container after the generated service implementation classes are registered.
:::

### Cleaning generator’s output

This generator supports cleaning either all generated service implementations, or only the ones from the selected model files using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the services from the model, and want the generated classes deleted.
:::

:::danger
Note that, while custom subclasses and partial classes will not be cleaned during these operations, all of your **inline customizations will be lost** during *Clean*, so you need to be very careful when running a *Clean* command on the generator or on the model project.
:::

If you have a generated file with a service implementation that contains inline custom code that you don't want to lose during *Clean*, then you need to do one of the following things:
- Remove a line saying "*This file can be DELETED DURING REGENERATION IF NO LONGER NEEDED*" in the header comment of the generated file, as instructed in that comment.
- Set `preserve-on-clean="true"` attribute on the `svc:customze` config element of the service, as shown below.

```xml
<object name="sales order">
  <operations>[...]
  <config>
<!-- highlight-next-line -->
    <svc:customize extend="true" preserve-on-clean="true"/>
  </config>
</object>
```
---
sidebar_position: 2
---

# View Models

Generates customizable view model classes for UI search or details views based on the type of their associated data object.

The generated view models are C# classes based on Xomega Framework, which can be reused in different types of C# clients, such as Blazor, WPF, or ASP.NET WebForms.

The view models store their underlying data objects and provide logic for handling view actions and navigating between views, passing any input parameters to those views, and handling the output parameters. The generated navigation logic is based on the view links that are defined in the model.

You can add your customizations to a subclass of the generated view model, and implement any reusable platform-independent view logic there, such as custom actions or navigation.

## Generator inputs

### View definitions

The generator uses view models of the view definitions in the Xomega model to generate the corresponding C# classes. Each view model is associated with a specific data object that is also defined in the model.

The generator will create the search or details types of view models based on whether or not the data object is a list object, as specified by its `list` attribute.

The logic for the standard actions on those view models, such as running the search or saving the view, will be mostly inherited from the corresponding base classes in the Xomega Framework but can be overridden or extended in a customized subclass. Such a subclass can be generated if you set the `customize="true"` attribute on the `ui:view-model` element.

The following snippet shows an example of a view model definition in the Xomega model.

```xml
<ui:view name="SalesOrderListView" title="Sales Order List" xmlns:ui="http://www.xomega.net/ui">
<!-- highlight-next-line -->
  <ui:view-model data-object="SalesOrderList" customize="true"/>
</ui:view>
```

### Links to views

Named links between views are defined on the data object of the view model, or on any of its child or descendant sub-objects.

For each link, you can specify the target view, whether or not it should be opened as a child view, the field on which to display the link, as well as the input and output parameters for the view.

For input parameters, you can specify the literal value to pass, or the name of the data object's field to source it from. Similarly, for link output parameters, you can specify the data object fields to populate when the view is closed, e.g. when the view is used for selection.

The snippet below illustrates a configuration of links in the model.

```xml
<xfk:data-object class="SalesOrderList" list="true" customize="true">
<!-- highlight-next-line -->
  <ui:link name="details" view="SalesOrderView" child="true">
    <ui:params>
      <ui:param name="sales order id" field="sales order id"/>
    </ui:params>
    <ui:display on-field="sales order number"/>
  </ui:link>
<!-- highlight-next-line -->
  <ui:link name="new" view="SalesOrderView" child="true">
    <ui:params>
      <ui:param name="_action" value="create"/>
    </ui:params>
  </ui:link>
</xfk:data-object>
```

:::note
Most of this setup of view models in the Xomega model for standard details and list objects can be easily added automatically by a special [model enhancement CRUD generator](../../model/crud).
:::

## Generator outputs

This generator creates C# classes for view models derived from an appropriate Xomega Framework base class, with code to handle navigation based on data object's links, as well as a static class for registering these view models for Dependency Injection (DI) with the service container.

For view models that are decorated with a `customize="true"` attribute, it also creates a subclass of the generated view model with a postfix *Customized* appended to the class name, if one does not exist yet, and will use this name for DI registration.

The customized classes will be nested under the corresponding generated view model class, according to the rules specified in the `.filenesting.json` file for the target client project.

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|View Models|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Presentation Layer\Common|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Client.Common /ViewModels/\{Module/\}\{File\}.cs|Relative path where to output files with generated View Models. The path may contain \{Module/\} and \{File\} placeholders to output files by module and view model respectively.|
|Custom Path||Relative path where to output override classes for the generated View Models. If not set, then the *OutputPath* will be used. The path must contain a \{File\} placeholder to output files by view model.|
|Registry File|../MySolution.Client.Common /ViewModels/ViewModels.cs|Relative path to the file for view models registration with the DI service container. The registration extension method will be derived from the file name.|

### Model configuration

The generator's configuration parameters that need to be also accessible to other generators are specified in the Xomega model in the `ui:views-config` element under the top-level `config` element, which is conventionally placed in the `global_config.xom` file.

These parameters consist of the namespace for the generated view models. The snippet below illustrates such a configuration.

```xml title="global_config.xom"
<ui:views-config modelsNamespace="MySolution.Client.Common.ViewModels"/>
```

### Common configurations

There is expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only.

You can rerun the generator when you add new links to data objects or change existing links on the data objects in the model, and also if you change the type of the data object associated with the view models.

:::note
The latter may require re-running other generators that depend on the same model elements, such as the data object generator. Therefore, this generator should be included in the build of the model project in the configuration, to allow you to easily regenerate all view models along with other artifacts.
:::

### Customizing the output

:::danger
You should never edit generated view models or registration classes directly. This allows re-running the generator at any time without losing your customizations.
:::

To add your customizations, you should edit a subclass of the generated view model class that was added when you specified the `customize` attribute on the view model.

:::note
You can also add your own custom subclass of the generated view models in your project, but then you will need to make sure to register that class with the dependency injection service container after the generated view models are registered.
:::

### Cleaning the generator’s output

This generator supports cleaning all generated view models using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the views from the model, and want the generated classes deleted and removed from the target project.
:::

:::caution
Note, that the customization subclasses that were generated for view models with a `customize="true"` attribute will not be cleaned during these operations to prevent any loss of custom code during an accidental run of such actions. Therefore, you may get compilation errors for those classes if you clean your view models, and will need to delete them manually as needed.
:::
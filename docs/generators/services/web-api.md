---
sidebar_position: 5
---

# Web API Controllers

Generates customizable ASP.NET controllers that help to expose business services via REST interface.

The REST configuration for the service operations needs to be provided in the model, and the generator takes care of the REST, as far as creating the controller classes that wrap the services and use Xomega Framework for error reporting, and registering them with the DI container.

You can add your customizations to a subclass of a generated controller, and implement any additional handling of HTTP requests or responses as needed.

## Generator inputs

The generator creates ASP.NET controllers for each service/object that has any operation annotated with a `rest:method` configuration element, where you need to provide the `verb` and a `uri-template` that may contain input parameters in curly braces, as illustrated below.

```xml
<objects>
  <object name="sales order">
    <operations>
      <operation name="update" type="update">
        <input>
          <param name="sales order id"/>
          <struct name="data">[...]
        </input>
        <config>
<!-- highlight-start -->
          <rest:method verb="PUT" uri-template="sales-order/{sales order id}"
                       xmlns:rest="http://www.xomega.net/rest"/>
<!-- highlight-end -->
        </config>
      </operation>
    </operations>
  </object>
</objects>
```

There can be only one input parameter that is not present in the URI template, which is usually a structure that goes into the body of the HTTP request.

For service operations that don't have the `rest:method` configuration the generator will output a warning, in order to draw your attention to such operations with missing REST configuration, since the REST clients will receive an obscure 404 error, if they try to call them.

If you intentionally don't want to expose a certain operation via REST, then you need to still add a `rest:method` element with the `not-supported="true"` attribute.

For example, the `authenticate` operation below can be used by the Web API internally for the JWT authentication, but should not be exposed via REST, as shown below.

```xml
<objects>
  <object name="person">
    <operations>
      <operation name="authenticate" type="update">
        <input arg="credentials" struct="credentials"/>
        <config>
<!-- highlight-next-line -->
          <rest:method not-supported="true"/>
          <wcf:operation not-supported="true"/>
        </config>
      </operation>
    </operations>
  </object>
</objects>
```

:::note
This REST configuration for standard CRUD and `ReadList` operations can be added automatically to the model by a special model enhancement CRUD generator with the *Generate Rest Methods* parameter set to `true`.
:::

## Generator outputs

This generator creates C# classes for ASP.NET controllers that wrap the business services, as well as a static class for registering them for Dependency Injection (DI) with the service container, under the specified path for the server-side project, which is usually a separate project for hosting REST services.

For objects that have a `rest:controller` element under their config element with a `customize="true"` attribute, it also creates a subclass of the generated controller with a postfix *Customized* appended to the class name, if one does not exist yet, and will use this name for DI registration.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Web API Controllers|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Service Layer|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Rest /{Module/}{File}.cs|Relative path where to output files with generated ASP.NET controllers. The path may contain {Module/} and {File} placeholders to output files by module and service respectively.|
|Custom Path||Relative path where to output override classes for the generated ASP.NET controllers. If not set, then the *OutputPath* will be used. The path must contain a {File} placeholder to output files by service.|
|Registry File|../MySolution.Services.Rest /Controllers.cs|Relative path to the file for ASP.NET controllers registration with the DI service container. The registration extension method will be derived from the file name.|
|**Parameters**|
|Namespace||Namespace for the generated classes. If not set, the namespace for service contracts will be used.|

### Model configuration

Parameters specified in the model configuration that are used by this generator consist of just the namespace for the service contracts, in case when the *Namespace* generator parameter is not set. This is specified in the `svc:services-config` element under the top level `config` model element, which is conventionally placed in the `global_config.xom` file, as illustrated by the following snippet.

```xml title="global_config.xom"
<svc:services-config namespace="MySolution.Services.Common" />
```

### Common configurations

There expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator either for the entire model, or for individual files by selecting them in the model project, and running the generator from the context menu.

You can rerun the generator when you change or add operations with a REST configuration in the model. Normally, this will require re-running other generators that depend on the same model elements, such as generators of UI views or service and data contracts as well as the service implementations.

Therefore, this generator should be included in the build of the model project in the configuration, in order to allow to easily regenerate all controllers along with other artifacts.

### Customizing the output

:::danger
You should never edit generated controllers or registration classes directly. This allows re-running the generator at any time without losing your customizations.
:::

To add your customizations, you should edit a subclass of the generated controller that was added when you specified the `customize` attribute on the `rest:controller` element of the object's `config` element, as follows.

```xml
<object name="sales order">
  <operations>[...]
  <config>
<!-- highlight-next-line -->
    <rest:controller customize="true"/>
  </config>
</object>
```

:::note
You can also add your own custom subclass of the generated controller in your project, but then you will need to make sure to register that class with the dependency injection service container after the generated controllers are registered.
:::

### Cleaning generator’s output

This generator supports cleaning either all generated controllers, or only the ones from the selected model files using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator. Also, it can be used as part of *Regenerate* action, which runs the *Clean* and then *Generate* actions, when you have removed some of the services from the model, and want the generated classes deleted and removed from the target project.
:::

:::caution
Note, that the customization subclasses that were generated for controllers with a `customize="true"` attribute will not be cleaned during these operations to prevent any loss of custom code during accidental run of such actions. Therefore, you may get compilation errors for those classes if you clean your controllers, and will need to delete them manually as needed.
:::
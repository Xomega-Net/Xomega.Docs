---
sidebar_position: 5
---

# Web API Controllers

Generates customizable ASP.NET controllers that help to expose business services via a REST interface.

The REST configuration for the service operations needs to be provided in the model, and the generator takes care of the REST, as far as creating the controller classes, which wrap the services and use Xomega Framework for error reporting and registering them with the DI container.

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

For service operations that don't have the `rest:method` configuration, the generator will output a warning, to draw your attention to such operations with missing REST configuration, since the REST clients will receive an obscure 404 error if they try to call them.

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
This REST configuration for standard CRUD and `ReadList` operations can be added automatically to the model by a special [model enhancement CRUD generator](../model/crud) with the *Generate Rest Methods* parameter set to `true`.
:::

## Generator outputs

This generator creates C# classes for ASP.NET controllers that wrap the business services and places them under the specified path for the server-side project, which is usually a separate project for hosting REST services.

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Web API Controllers|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Service Layer|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Rest /{Module/}{File}.cs|Relative path where to output files with generated ASP.NET controllers. The path may contain {Module/} and {File} placeholders to output files by module and service respectively.|
|**Parameters**|
|Namespace||Namespace for the generated classes. If not set, the namespace for service contracts will be used.|

### Model configuration

The model configuration parameters that are used by this generator consist of just the namespace for the service contracts, in the case when the *Namespace* generator parameter is not set. This is specified in the `svc:services-config` element under the top-level `config` model element, which is conventionally placed in the `global_config.xom` file, as illustrated by the following snippet.

```xml title="global_config.xom"
<svc:services-config namespace="MySolution.Services.Common" />
```

### Common configurations

There is expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator either for the entire model, or for individual files by selecting them in the model project and running the generator from the context menu.

You can rerun the generator when you change or add operations with a REST configuration in the model. Normally, this will require re-running other generators that depend on the same model elements, such as generators of UI views or service and data contracts as well as the service implementations.

Therefore, this generator should be included in the build of the model project in the configuration, to allow you to easily regenerate all controllers along with other artifacts.

### Customizing the output

If you need to set a custom HTTP status code for your operation, then you can always do it in your service implementation classes. However, sometimes you may need to configure additional HTTP properties of your response or perform other REST-specific actions, for which you need to customize the generated code for your controller's actions.

To customize the code for the generated action you need to set the `customize="true"` attribute on the `rest:method` element of your service operation in the model. For example, if you have a `create` operation and want to return a `201 (Created)` status and set the `location` header pointing to the newly created resource, then you can customize this operation in the model as follows.

```xml
<object name="error log">
  <fields>[...]
  <operations>
    <operation name="create" type="create">
      <input arg="data">[...]
      <output>
        <param name="error log id"/>
      </output>
      <config>
<!-- highlight-next-line -->
        <rest:method verb="POST" uri-template="error-log" customize="true"/>
      </config>
    </operation>
  </operations>
</object>
```

After you run the generator, the `CreateAsync` action in the `ErrorLogController` will have the `CUSTOM_CODE_START` and the `CUSTOM_CODE_END` marker comments around the method's body, where you can customize the generated code. These comments will ensure that regenerating Web API controllers will preserve your custom code, which you can update as illustrated below.

```cs title="ErrorLogController.cs"
[Route("error-log")]
[HttpPost]
public async Task<ActionResult> CreateAsync([FromBody] ErrorLog_CreateInput _data,
                                            CancellationToken token = default)
// highlight-next-line
{// CUSTOM_CODE_START: Provide a custom implementation for the Create method below
    ActionResult response;
    try
    {
        if (ModelState.IsValid)
        {
            Output<ErrorLog_CreateOutput> output = await svc.CreateAsync(_data, token);
// removed-next-line
            response = StatusCode((int)output.HttpStatus, output);
// added-next-line
            response = CreatedAtAction("Read", new { _errorLogId = output.Result.ErrorLogId }, output);
            return response;
        }
        else
        {
            currentErrors.AddModelErrors(ModelState);
        }
    }
    catch (Exception ex)
    {
        currentErrors.MergeWith(errorsParser.FromException(ex));
    }
    response = StatusCode((int)currentErrors.HttpStatus, new Output(currentErrors));
// highlight-next-line
    return response;// CUSTOM_CODE_END
}
```

:::caution
To make sure that your custom code is preserved during subsequent generator runs, you need to make sure that the marker text after the `CUSTOM_CODE_START` comment doesn't change from one run to another, since it's used as your custom code identifier.
:::

The marker text contains the name of the method, which means that renaming an operation may result in a loss of the custom code, so you need to be careful when doing that.

:::tip
If you do need to rename the operation in the model, make sure you make a copy of your custom implementation, or, better yet, **version control your code** so that you could see any differences in the generated code after you rerun the generator.
:::


### Cleaning the generator’s output

This generator supports cleaning either all generated controllers or only the ones from the selected model files using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the services from the model, and want the generated classes deleted and removed from the target project.
:::

:::caution
Note, that generated controllers that have REST methods with a `customize="true"` attribute **will not be cleaned** during these operations to prevent any loss of custom code during an accidental run of such actions. Therefore, you may get compilation errors for those classes if you clean your controllers, and will need to delete them manually as needed.
:::
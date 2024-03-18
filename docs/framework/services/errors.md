---
sidebar_position: 2
---

# Error Reporting

Xomega Framework provides a common framework for reporting and handling errors both in the service layer on the backend and in the presentation layer on the front end. It defines a common structure for error messages of various types and severities, allows reporting multiple errors at the same time, and supports the internationalization of the error message text for the user's locale.

## Error messages{#message}

Different types of messages that your app needs to report to the users are described by the class `ErrorMessage` in the `Xomega.Framework` namespace. The messages have the following attributes.
- `Type` - the type of the message from the `ErrorType` enum, e.g. `Validation`, `System`, etc.
- `Severity` - the message severity from the `ErrorSeverity` enum, e.g. `Error`, `Warning`, etc.
- `Code` - message code that uniquely identifies the message, and is used as a resource key for translation.
- `Message` - fully localized message text with all actual values included in the message.
- `HttpStatus` - the HTTP status code associated with the message. When not set explicitly, it's derived from the `Type`.

:::note
Error messages are configured to be serializable for returning them either from the REST API or from the WCF calls.
:::

### Error types{#types}

Error types help you categorize the messages that your application produces. You can handle messages differently within your application or with your logging infrastructure based on the message type.

Properly setting the error type can also help you make sure that a proper HTTP status code is returned from a REST API call. The following error types are defined in the Xomega Framework.

|Error Type|Description|Default HTTP Status Code|
|-|-|-|
|`Concurrency`|Error resulting from concurrency checks.|409 - `HttpStatusCode.Conflict`|
|`Data`|Error resulting from a data issue.|404 - `HttpStatusCode.NotFound`|
|`External`|Error originated from an external system.|502 - `HttpStatusCode.BadGateway`|
|`Security`|Error resulting from a security validation.|403 - `HttpStatusCode.Forbidden`|
|`System`|Internal system error.|500 - `HttpStatusCode.InternalServerError`|
|`Validation`|Error resulting from a request validation.|400 - `HttpStatusCode.BadRequest`|
|`Functional`|Error resulting from a functional validation.|400 - `HttpStatusCode.BadRequest`|
|`Message`|Error contains a message or a warning.|200 - `HttpStatusCode.OK`, or 500 if severity is an error.|


### Error severity{#severity}

Each error message has a severity that determines the execution flow of the operation, as well as the HTTP status code of the response. The error severity can be one of the following values.

- `Info` - Information message that can be displayed to the user. An info message does not result in a failure of the operation by itself, and can also be used internally by the system to communicate some information to the calling client without showing it to the user, similar to the HTTP response headers.
- `Warning` - A warning that may be displayed to the user for confirmation before proceeding. Normally, if an operation generates any warnings when called initially, it would not succeed, but rather show those warnings to the user. If the user confirms the warnings, the operation should be called again with a flag to ignore warnings, in which case it will succeed.
- `Error` - An error, that will be displayed to the user with the other errors. It doesn't stop the execution flow but prevents the operation from successfully completing. An error is generated when validation failed, but it doesn't prevent the operation from performing other validations, which allows you to report multiple errors at once.
- `Critical` - A critical error, which stops the execution immediately and returns a fault to the user. A critical error is typically raised when it prevents any further validations. For example, if the operation needs to look up an entity by the supplied key, an invalid key would result in a critical error, since the operation cannot proceed without that entity.

:::info
The default HTTP status codes for the message types apply only when the error severity is at least `Error`. For `Info` and `Warning` messages, the default HTTP status code is 200 - `HttpStatusCode.OK`.
:::

## Error list{#list}

During the execution of an operation, the current errors and other messages are added to a collection that is defined by the `ErrorList` class in the `Xomega.Framework` namespace. The `ErrorList` class provides support for adding various types of error messages, translating the message text into the current user's language, as well as other useful functions for working with error messages.

### Accessing current errors

The `ErrorList` for the current operation's errors is not supposed to be created manually but rather instantiated by the dependency injection container for the current scope. Therefore, you need to make sure that it is registered in the startup class of your application as a scoped service, as shown below.

```cs
services.AddScoped<ErrorList>();
```

:::note
You can also use the extension method `AddErrors` provided by Xomega Framework to register both the `ErrorList` and default [`ErrorParser`](#errorParser) services, as follows.
```cs
services.AddErrors(env.IsDevelopment());
```
:::

The error list for the current service operation is available in each service implementation class through the `currentErrors` field of the base service class.

:::warning
The error lists used in the presentation logic are created and accessed differently. You can learn about it in the corresponding sections for the common UI logic.
:::

### Adding error messages{#adding}

The `ErrorList` class provides a set of convenient methods to easily add messages of various types and severity. You may need to pass an error type and the message code, which is used as the resource key to look up the message text in the current language, as well as the values of any parameters of the message that will be substituted into any message placeholders.

Most of them return the error message that was added so that you could further customize it in the code. The following examples illustrate the usage of these methods using [static constants](#messageCodes) from the `Messages` class as message codes.

```cs
// adds an Operator_NotSupported validation error
currentErrors.AddValidationError(Messages.Operator_NotSupported, "OPER", "YourField");

// adds a message ExternalSystemError for an error from the external system without aborting
currentErrors.AddError(ErrorType.External, Messages.ExternalSystemError, externalErrorText);

// adds an OrderWillBeDeleted warning message
currentErrors.AddWarning(Messages.OrderWillBeDeleted, orderNumber);

// adds an OrderCreated info message, and sets a custom status code
ErrorMessage msg = currentErrors.AddInfo(Messages.OrderCreated, orderNumber);
msg.HttpStatus = HttpStatusCode.Created;

// adds an OperationNotAllowed critical error without aborting the execution.
currentErrors.CriticalError(ErrorType.Security, Messages.OperationNotAllowed, false);

// adds an EntityNotFoundByKey critical error with the specified parameters, and aborts the execution.
currentErrors.CriticalError(ErrorType.Data, Messages.EntityNotFoundByKey, "YourEntity", key);
```

If the convenience methods above don't work for you, you can also create an `ErrorMessage` manually and add it to your error list using the `Add` method. In order to get a localized message text from the code, you can call the `GetMessage` method of the error list, as shown below.

```cs
string msgCode = "code";
/* highlight-next-line */
string msgText = currentErrors.GetMessage(msgCode, param1, param2);
var msg = new ErrorMessage(ErrorType.Message, msgCode, msgText, ErrorSeverity.Info);
currentErrors.Add(msg);
```

:::warning
If the message text cannot be found in the resources by the provided message code, that code will be used as the message text.

This means that you can technically pass the message text directly as the code without any resources. While this may look quick and easy, we still recommend defining proper codes and using them as [resource keys for the messages](#messageCodes), in order to have short message identifiers and support any future [localization](#i18n).
:::

If you have another list of error messages created separately, then you can also merge it with the current error list using the `MergeWith` method, as follows.

```cs
currentErrors.MergeWith(errorList);
```

If both lists reference the same errors, or if you merge a list with itself, then it won't add duplicate messages.

## Reporting service errors{#reporting}

As you perform the service operation, you will be adding errors, warnings or other types of messages to the list of current errors. As mentioned above, adding a critical error using the `CriticalError` method on your error list will immediately throw an exception and abort the execution.

If your operation adds errors or calls any other functions or services that may add errors to the current error list, then at some point you may want to manually abort the operation, if any errors have been added, which you can do as follows.

```cs
currentErrors.AbortIfHasErrors();
```

Even if there are no errors, you may still want to manually abort the operation, such as when you have some warnings that you need to report to the user for confirmation and the operation was not called with a flag to ignore warnings. In this case, you can call the `Abort` method explicitly, and provide a reason for abortion as the argument, as follows.

```cs
currentErrors.Abort(currentErrors.ErrorsText);
```

:::note
Notice how the `ErrorList` class provides a property `ErrorsText` to get the combined text of all its messages.
:::

Aborting an operation like that throws a special `ErrorAbortException` for the current error list. To properly report this and any other exceptions to the users, your service operation should perform all its logic within a `try` block. In the corresponding `catch` block you should convert the caught exception to an error list using the `errorParser` member from the base service, and then merge it with the current list of errors.

At the end of the method, you should construct a new `Output` class from the `currentErrors`, as well as any result structure created by the operation, and return it from the method. The following example demonstrates these error reporting steps within an `Update` service operation of the sales order service.

```cs
public virtual async Task<Output<SalesOrder_UpdateOutput>> UpdateAsync(...)
{
    SalesOrder_UpdateOutput res = new SalesOrder_UpdateOutput();
    try
    {
        ...
/* highlight-next-line */
        currentErrors.AbortIfHasErrors();
        ...
    }
    catch (Exception ex)
    {
/* highlight-next-line */
        currentErrors.MergeWith(errorParser.FromException(ex));
    }
/* highlight-next-line */
    return new Output<SalesOrder_UpdateOutput>(currentErrors, res);
}
```

:::note
The HTTP status of the operation will be automatically determined based on the highest HTTP status of each error in the list. Alternatively, you can also explicitly set the status of the operation on the current error list, as follows.
```cs
currentErrors.HttpStatus = HttpStatusCode.MultiStatus;
```
:::

### Exception parsing and logging{#errorParser}

The `errorParser` member of the base service that is used for constructing an `ErrorList` from an exception, as well as for logging that exception, is an instance of a flexible class `ErrorParser` provided by Xomega Framework.

When you call its method `FromException`, it will recognize the standard `ErrorAbortException` for the error list being aborted, as well as some instances of a standard `WebException` where the error list is returned directly in the HTTP response (e.g. when used as a fault contract in WCF).

It will also automatically log that exception using either the registered service `ILogger<ErrorParser>` or the `Trace` class from the `System.Diagnostics`. If you want to use a custom logger that is specific to your service, then you can pass it as a second parameter, as follows.

```cs
ErrorList errList = errorParser.FromException(ex, myServiceLogger);
```

If you want to customize exception parsing and logging provided by Xomega Framework, then you can subclass the `ErrorParser` class and override the `FromException` or `LogException` methods as needed. For example, you can handle specific exceptions that your app produces in the overridden `FromException` to create appropriate error messages. Or you can disable or customize logging in the overridden `LogException` method.

The `ErrorParser` class is constructed with an instance of a service provider and a boolean flag `fullException`, which indicates whether or not to output the full text of unhandled exceptions in the resulting error list. When that flag is set to `false`, a generic framework message with a resource key `Messages.Exception_Unhandled` will be used, and you'd have to check the logs for the full message.

:::tip
You can override the generic framework message for unhandled exceptions in your project by using [hierarchical resources](#i18n).
:::

You need to register the default (or a custom) error parser with the DI container in the startup class for your application. You can add it as a singleton, and use the full exception in the development environment only, as follows.

```cs
bool fullException = builder.Environment.IsDevelopment();
/* highlight-next-line */
services.AddSingleton(sp => new ErrorParser(sp, fullException)); // add default or custom error parser
```

If you want to use the default error parser, then you can register it together with the `ErrorList` using an extension method `AddErrors` provided by the Xomega Framework, as follows.

```cs
services.AddErrors(builder.Environment.IsDevelopment()); // add default error parser and error list
```

## Internationalization{#i18n}

Xomega Framework supports localization using hierarchical resources, which enhances the standard .Net resource management.

### Hierarchical resources{#resources}

The standard way to manage and access resources in .Net is through the `ResourceManager` class, which is constructed for a specific set of resources bundled with the assembly. It allows you to retrieve any resource by a string name (key) using a `GetObject` method, or to also get any string resource using a `GetString` method.

The problem with this approach is that some resources may be defined in the framework libraries or common shared libraries, while others may be in specific projects. So, in any place where you need to get a localized string, you may need to look it up in multiple resource sets like those.

Moreover, if you want to override a common localized string defined in the framework library, your code would need to check a resource set for the more specific project first before checking the common resource sets.

To address these issues Xomega Framework provides a simple class `CompositeResourceManager` that extends the `ResourceManager` class and is constructed from an *ordered array* of other resource managers. Whenever you look up a resource from such a composite resource manager, it will walk the list of its inner resource managers and will return the value from the first one that has that resource.

If during the construction you pass more specific resource managers first, and the framework resources last, then you will be able to override any common or framework resources in your more specific projects. You can also pass a composite resource manager to another composite resource manager, which would create a hierarchy of resources.

:::note
Xomega Framework also supports another way of overriding generic resources by providing an extension `GetString` method that takes a key prefix in addition to the resource key, and checks if the resource exists for the prefixed key first.

This way, for example, if you call `GetString("SaveButton", "LoginView_")` then you can override the text of the standard *Save* button for the *Login* view by specifying it under the "LoginView_SaveButton" key in your resources.
:::

### Resource registration

To make a composite resource manager available to business services and error lists, you need to register it as a singleton with the DI container in your startup class.

In the following example, we register a composite resource manager, where the messages from a common client project add to and override the messages from the services project, which in turn add to and override the standard Xomega Framework messages.

```cs
/* highlight-next-line */
services.AddSingleton<ResourceManager>(sp => new CompositeResourceManager(
    MyProject.Client.Common.Messages.ResourceManager,
    MyProject.Client.Common.Labels.ResourceManager,
    MyProject.Services.Entities.Messages.ResourceManager,
    Xomega.Framework.Messages.ResourceManager));
```

### Message resources{#messageCodes}

To define localizable message texts for your application's messages, we recommend adding them to separate `.resx` resource files that use the standard XML resources format. You should set the resource *Name* to your message code, and the *Value* to the localized message text with number-based placeholders for any parameters.

We also recommend that you specify the description of the parameters that are expected by the message at each position using the *Comment* field, as illustrated below.

|Name|Value|Comment|
|-|-|-|
|EntityNotFoundByKey|\{0} with id \{1} not found.|\{0}=Entity Type, \{1}=Entity ID|
|Operator_NotSupported|Unsupported operator \{0} for the \{1}.|\{0}=Operator, \{1}=Field name|
|Validation_NumberMaximum|\{0} cannot be greater than \{1}.|\{0}=Property name, \{1}=Maximum value|

By default, resource files added through Visual Studio use a custom tool `ResXFileCodeGenerator`, which generates a nested code file `MyResources.Designer.cs` and a class that gives you access to the `ResourceManager` for those resources, and allows you to get the values of each resource using static access members. The limitation of those generated members is that you won't have programmatic access to the resource names, and they only use resources defined in the current resource set, so you cannot use hierarchical resources.

To avoid hardcoding message codes in your app, we recommend creating a simple static class, where your message codes will be accessible as constant strings, with the message text and description of parameters specified in the `<summary>` comment, as follows.

```cs
public static class Messages
{
    ...
    /// <summary>
    /// Unsupported operator {0} for the {1}.
    /// Where {0}=Operator, {1}=Field name
    /// </summary>
    public const string Operator_NotSupported = "Operator_NotSupported";
    ...
}
```

:::tip
You can generate such a class from your resource file using a text template generator, as described below.
:::

This way you will be able to use these constants when adding messages to your error list, or when using them for looking up the message text, as follows.

```cs
currentErrors.AddValidationError(Messages.Operator_NotSupported, "OPER", "YourField");
```

Now, when selecting a constant from the list of the class members in Visual Studio, or when hovering over it in the code, Intellisense will show you the details of the message with the expected parameters from the doc comment, in order to help you pick the right message code and supply the proper parameters.

### Message constants generator

To save you from creating a class with message constants described above, and from manually keeping it in sync with the message resources, Xomega Framework has a custom T4 text template that generates it from your message resources.

The generated class will also have a standard accessor to the `ResourceManager` for the current resource set, just like the standard `.Designer.cs` classes generated for `.resx` files, so you can turn off that default generator.

:::tip
The message resource files included in the initial solution template created by the Xomega.Net extension for Visual Studio will already have this T4 generator enabled.
:::

If you need to add this T4 generator for your resource file, first make sure you download the [Messages.t4](https://github.com/Xomega-Net/XomegaFramework/blob/master/src/T4/Messages.t4) template file and add it to a folder in your solution, e.g. *T4*. Then, for each resource file with messages, you should create a text template file in your project that includes that template, as follows.

```xml title="Messages.tt"
<#@ include file="../T4/Messages.t4" #>
```

:::note
The name of the text template file will determine the name of the generated class. So, if you call your template `Messages.tt` then the generated class will be in the `Messages.cs` file.
:::

Finally, you need to make your text template file nested under your resource file, and set `TextTemplatingFileGenerator` as the generator for it. To do that you can update your project file, as follows. 

```xml title="MyProject.csproj"
  <ItemGroup>
    <None Update="Messages.tt">
<!-- highlight-start -->
      <Generator>TextTemplatingFileGenerator</Generator>
      <DependentUpon>Resources.resx</DependentUpon>
<!-- highlight-end -->
    </None>
  </ItemGroup>
```

Now, whenever you add or update your message resources in the `Resources.resx`, you can just right-click on the nested `Messages.tt` file in Visual Studio, and select the *Run Custom Tool* menu to regenerate the message constants.

:::warning
For Visual Studio 2022 you need to edit the downloaded `Message.t4` file and remove the following line.
```
<#@ assembly name="EnvDTE" #>
```
:::

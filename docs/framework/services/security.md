---
sidebar_position: 5
---

# Securing Services

Securing your business services to make sure that users can perform only their authorized functions and can access only the allowed data is essential for any business application.

Since Xomega Framework promotes a [services architecture](common#architecture), where the same business services can be reused with various multi-tier architectures, you would want to secure each operation as part of its implementation rather than on the remote API level. This would allow you to reuse your service security logic with whichever architecture you decide to use.

## Services security

Xomega Framework supports standard .NET claims-based security for securing business services. The base service in the Xomega Framework provides access to the current principal for any inheriting services through its property `CurrentPrincipal`. The latter is retrieved from the service provider as follows.
1. If the DI container has an instance of the `IPrincipal` service, then it will use that instance.
1. If the DI container has an `IPrincipalProvider` service, then it will use the `CurrentPrincipal` of that service.
1. If none of the above is available, the `Thread.CurrentPrincipal` will be used.

:::caution
Using `Thread.CurrentPrincipal` to get the current principal may not work well in async methods and services.
:::

### Securing operation access

In order to verify that the current user is authorized to perform any of the business functions that the service operation performs, including calling the operation in general, you should use the claims from the `CurrentPrincipal` to perform the security check, and report a critical error of type `ErrorType.Security`, if security check fails.

For example, if an operation is only allowed to be called by users that have an `Employee` role, then you should add that security check at the top of the implementation method, as follows.

```cs
public virtual async Task<Output<ICollection<SalesOrder_ReadListOutput>>> ReadListAsync(
    SalesOrder_ReadListInput_Criteria _criteria, CancellationToken token = default)
{
    try
    {
/* highlight-next-line */
        if (!CurrentPrincipal.IsInRole(Roles.Employee))
        {
/* highlight-next-line */
            currentErrors.CriticalError(ErrorType.Security, Messages.OperationNotAllowed);
        }
    ...
}
```

:::note
Using `ErrorType.Security` will result in the HTTP status code 403 (Forbidden), when the service is called via REST API.
:::

You can use as generic or as specific error message as your security requirements allow. In the example above we used an error code as a resource key for a generic message, following the [message localization](errors#messageCodes) best practices.

:::tip
Alternatively, you can throw a custom exception instead, e.g. `SecurityCheckException`, and implement a [custom error parser](errors#errorParser), which would add a security message to the error list for this exception. This will allow you to output a more detailed message in a test environment, and a generic message in the production environment.
:::

### Securing data access

In addition to making sure that the user can perform only authorized functions, you need to make sure that the user can also see only the data that they are allowed to see. This is especially important when your application allows access to external users that should be able to see only their data, but not that of other users.

To restrict access to your data to authorized users only, you would typically get the ID associated with the user from the `CurrentPrincipal`'s claims, such as the user ID or a customer ID, and use it to restrict the results to only the data that the user is allowed to access.

In the following example, when reading a list of sales orders, we get the `personId` from the current users's claims, and add it as a filter to return only the sales orders associated with the current user.

```cs
public virtual async Task<Output<ICollection<SalesOrder_ReadListOutput>>> ReadListAsync(
    SalesOrder_ReadListInput_Criteria _criteria, CancellationToken token = default)
{
    var src = from obj in ctx.SalesOrder select obj;

    // get the person ID associated with the current user from the claims
    var identity = CurrentPrincipal.Identity as ClaimsIdentity;
    var idClaim = identity?.Claims?.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);

    if (int.TryParse(idClaim?.Value, out int personId))
    {
        // filter sales orders for the customer associated with the current user
/* highlight-next-line */
        src = src.Where(o => o.CustomerObject.PersonObject.BusinessEntityId == personId);
    }
    ...
}
```

:::tip
To simplify writing your security checks, you may want to consider adding extension methods to the `IPrincipal` interface, which would access the values of the needed claims, check proper roles, etc. This way, for instance, in the code above you'd be able to get the person ID, as follows.
```cs
int? personId = CurrentPrincipal.GetPersonId();
```
:::

## Principal providers

As you saw above, in order for the services to access the current principal, your `Startup` class needs to register with the DI container either a method to get an instance of the current `IPrincipal`, or an implementation of the `IPrincipalProvider` interface that is defined in the `Xomega.Framework` namespace.

Xomega Framework provides a default implementation class called `DefaultPrincipalProvider`, which exposes the `CurrentPrincipal` property. You can register this provider with the DI container for the current context, and use it to set the current principal in your code based on the specific technology you are using.

### Principal in ASP.NET Core{#aspnet}

For ASP.NET Core applications, such as Blazor Server or when hosting your business services as a WebAPI, you can register a `ContextPrincipalProvider` provided by Xomega Framework as a transient service, which pulls the current principal from the current `HttpContext`, as shown below.

```cs
public void ConfigureServices(IServiceCollection services)
{
    ...
/* highlight-next-line */
    services.AddTransient<IPrincipalProvider, ContextPrincipalProvider>();
}
```

### Principal in WCF apps{#wcf}

WCF services don't support dependency injection by default. If you want to expose your business services via WCF, you'll need to use Xomega Framework [support for WCF](api/wcf), and register a scoped `DefaultPrincipalProvider`, as shown below, which Xomega Framework will use to set the current principal from the current `ServiceSecurityContext`.

```cs
public void ConfigureServices(IServiceCollection services)
{
    ...
/* highlight-next-line */
    services.AddScoped<IPrincipalProvider, DefaultPrincipalProvider>();
}
```

### Principal in Blazor WebAssembly{#wasm}

Normally, you would not have your business services running in WebAssembly (Wasm). Instead, your business services would be hosted as an [ASP.NET Core app](#aspnet), which the Blazor Wasm app would access via a REST API from the browser.

However, to provide the current principal to any Xomega Framework objects and services on the client side of the Blazor Wasm app, the framework offers an implementation class `AuthStatePrincipalProvider`, which sets the current principal from the Blazor's `AuthenticationStateProvider`. You can register it with your DI container in the main `Program` class for your Wasm app, as follows.

```cs
public static async Task Main(string[] args)
{
    var builder = WebAssemblyHostBuilder.CreateDefault(args);
    var services = builder.Services;
    ...
/* highlight-next-line */
    services.AddSingleton<IPrincipalProvider, AuthStatePrincipalProvider>();
}
```

### Principal in WPF apps{#wpf}

Just like with the Blazor Wasm, multi-tier WPF apps would not run any business services, which would be running separately, and accessed by the WPF client via REST API or WCF. The only instance when WPF apps would have embedded business services is with two-tier client-server applications.

Be default, WPF apps don't have dependency injection enabled, so you'll need to set it up manually in your app. Since WPF apps are single-user applications, you would register the `DefaultPrincipalProvider` as a singleton with your DI container, as follows.

```cs
public void ConfigureServices(IServiceCollection services)
{
    ...
/* highlight-next-line */
    services.AddSingleton<IPrincipalProvider, DefaultPrincipalProvider>();
}
```

Once your app authenticates the current user, it will need to get the current `IPrincipalProvider` service from the service provider, and set the `CurrentPrincipal` to the authenticated user.
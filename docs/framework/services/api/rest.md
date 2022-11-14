---
sidebar_position: 6
---

# REST API for Services

Once you have your business services implemented, exposing them via a REST API should be quite easy by creating a thin layer of controllers wrapping those services.

Additionally, the `Xomega.Framework.AspNetCore` package provides several useful classes and controllers that help you with exposing your REST API.

:::tip
Xomega.Net for Visual Studio allows you to **generate the WebAPI controllers** for your business services from a Xomega model, so you don't need to write them manually.
:::

## WebAPI controllers

To expose a business service via REST API, you would typically create a corresponding controller that wraps your service and add methods with HTTP actions for any operations that you want to expose.

### Service controllers

Each controller that wraps a business service will need the following services injected from the DI container:
- An instance of the actual business service to wrap.
- The list of errors for the current operation.
- An error parser for converting and adding any exceptions to the error list.

To standardize on the last two common items, Xomega Framework provides a base class `BaseController`, which takes the error list and an error parser, and makes them available to any controller actions. So you would typically declare your controllers, as follows.

```cs
/* highlight-next-line */
public partial class SalesOrderController : BaseController
{
    private readonly ISalesOrderService svc;

/* highlight-next-line */
    public SalesOrderController(ErrorList errorList, ErrorParser errorParser, ISalesOrderService service)
        : base(errorList, errorParser)
    {
        svc = service;
    }
    ...
}
```

You can configure these controllers in the `Startup` class of your web application using the standard ASP.NET Core mechanisms, as illustrated below.

```cs
public class Startup
{
    public void Configure(IApplicationBuilder app)
    {
        ...
        app.UseEndpoints(endpoints =>
        {
/* highlight-next-line */
            endpoints.MapControllers();
        });
    }

    public void ConfigureServices(IServiceCollection services)
    {
        ...
/* highlight-next-line */
        services.AddControllers(o => o.Filters.Add(new AuthorizeFilter()));
        ...
    }
}
```

### Controller actions

The action methods on your controller for any operations that you want to expose via REST will look similar to the actual methods for the corresponding service operations, but decorated with the WebAPI attributes, such as `Route`, HTTP verb (e.g. `HttpPut`), and any parameter attributes like `FromRoute` or `FromBody`.

The main function of the action is to **call your service method** and return the result of the operation using the HTTP status code of the result. However, you also want to do the following things in your action.
1. **Check the model validation errors** using `ModelState.IsValid`. The model will be validated by ASP.NET Core, and if it is invalid, then, instead of calling your service method, you will want to add those validation errors to the current error list using an extension method `AddModelErrors` for ASP.NET.
1. **Wrap your code in the `try/catch`** and handle any exceptions by adding them to the current errors using the `errorParser`. In both cases you will want to return an `Output` with the current errors and no results, using the HTTP status code of the current errors.

The following example demonstrates an action on the `SalesOrderController` that wraps an `UpdateAsync` operation and implements the items discussed above.

```cs
[Route("sales-order/{_salesOrderId}")]
[HttpPut]
public async Task<ActionResult> UpdateAsync([FromRoute] int _salesOrderId,
                                            [FromBody] SalesOrder_UpdateInput_Data _data,
                                            CancellationToken token = default)
{
    try
    {
        if (ModelState.IsValid)
        {
/* highlight-next-line */
            Output<SalesOrder_UpdateOutput> output = await svc.UpdateAsync(_salesOrderId, _data, token);
            return StatusCode((int)output.HttpStatus, output);
        }
/* highlight-next-line */
        else currentErrors.AddModelErrors(ModelState);
    }
    catch (Exception ex)
    {
/* highlight-next-line */
        currentErrors.MergeWith(errorsParser.FromException(ex));
    }
/* highlight-next-line */
    return StatusCode((int)currentErrors.HttpStatus, new Output(currentErrors));
}
```

:::caution
While ASP.NET Core does support synchronous methods, make sure that you **use async methods** for both your actions and service operations.
:::

## Unhandled errors

While you can properly report any exceptions in the current error list using a `try/catch` in each action, there may be still unhandled exceptions raised by the ASP.NET Core middleware. If you also want to report them in a standardized way through an error list, then Xomega Framework provides a special `ErrorController` for that, which you can register as the global exception handler in your startup class, as follows.

```cs
public void Configure(IApplicationBuilder app)
{
    ...
    // configure global exception handling using Xomega Framework
/* highlight-next-line */
    app.UseExceptionHandler(ErrorController.DefaultPath);
}
```

:::note
You can also rely on this global exception handler instead of adding a `try/catch` in every controller action, but the latter provides you with more flexibility to handle caught exceptions in a custom way.
:::

## Token authentication

When exposing your services via a REST API you want to make sure that your WebAPI is secured and allows access only to authenticated users. The typical authentication mechanism for REST APIs is by providing a *Bearer* token in the *Authorization* header, such as a JWT token.

The token can be created either by a trusted issuer, such as your identity provider or by the WebAPI application itself, which would be able to populate application-specific claims for the current user. Xomega Framework can help you implement authentication endpoints that can issue access tokens, as described below.

:::caution
For secure production systems we recommend using a certified third-party identity provider and setting up your Web API to trust the tokens issued by that provider, e.g with OAuth or OpenID Connect.
:::

### Authentication controller

To add to your WebAPI an ability to issue access tokens, which would be used to authenticate the users for any subsequent calls, Xomega Framework provides a base class `TokenAuthController`, which you need to subclass in your own authentication controller, as follows.

```cs
/* highlight-next-line */
public class AuthenticationController : TokenAuthController
{    
    public AuthenticationController(ErrorList errorList, ErrorParser errorParser,
/* highlight-next-line */
        IOptionsMonitor<AuthConfig> configOptions, ...) // inject any additional services as needed
        : base(errorList, errorParser, configOptions)
    {
    }
}
```

In your controller, you will need to add one or more endpoints that would return an access token, such as JWT, based on the provided credentials. In the basic case, the credentials could contain the user name and password that the user enters in the *Login* dialog. However, it could also use access tokens from other trusted issuers, such as Microsoft, Active Directory, Google, etc, which enables single sign-on (SSO).

Inside the authentication endpoint, you would typically validate the provided credentials, look up the user info related to the current application, construct a claims identity based on that info, and then build an access token for that identity using the `GetSecurityToken` method, which you will then return to the caller using the standard Xomega Framework protocol with [error reporting](../errors).

In the following example, the `authentication` endpoint accepts a user name and password credentials and returns a JWT token with the claims for the current user.

```cs
[AllowAnonymous]
[HttpPost]
[Route("authentication")]
public async Task<ActionResult> AuthenticateAsync([FromBody] Credentials credentials, CancellationToken token)
{
    try
    {
        // validate that user name and password are populated
        if (!ModelState.IsValid)
           currentErrors.AddModelErrors(ModelState);
        currentErrors.AbortIfHasErrors();

/* highlight-next-line */
        var user = ValidateUser(credentials.UserName, credentials.Password);

        // construct a claims identity for the user
        ClaimsIdentity identity = new ClaimsIdentity();
        identity.AddClaim(new Claim(ClaimTypes.Name, credentials.UserName));
        identity.AddClaim(new Claim(ClaimTypes.Role, user.Role));
        ...

        // generate a JWT token
        var jwtTokenHandler = new JwtSecurityTokenHandler();
/* highlight-next-line */
        string jwtToken = GetSecurityToken(identity, jwtTokenHandler);
        return StatusCode((int)currentErrors.HttpStatus, new Output<string>(currentErrors, jwtToken));
    }
    catch (Exception ex)
    {
        currentErrors.MergeWith(errorsParser.FromException(ex));
    }
    return StatusCode((int)currentErrors.HttpStatus, new Output(currentErrors));
}
```

Any authentication errors should be added to the `currentErrors` list, which is returned in the response.

:::note
This endpoint should be decorated with the `AllowAnonymous` attribute to allow unauthenticated calls.
:::

### Authentication configuration

To configure the parameters for the issued tokens Xomega Framework uses the `appsettings` configuration under the standard `AuthConfig` element, as follows.

```json title="appsettings.json"
{
  ...
  "AuthConfig": {
    "SigningKey": "This is a secret string that is used to encrypt JWT security tokens.",
    "Issuer": "http://localhost:61621/",
    "Audience": "Anyone",
    "ExpiresMin": 720
  }
}
```

To enable this configuration you need to register it in your `Startup` class using the `AddAuthConfig` extension method, and then use it to provide the token validation parameters, as follows.

```cs title="Startup.cs"
private readonly IConfiguration configuration;
...
public void ConfigureServices(IServiceCollection services)
{
    // configure JWT authentication
/* highlight-next-line */
    var jwtOptions = services.AddAuthConfig(configuration);

    services.AddAuthentication(x =>
    {
        x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(x =>
    {
        x.RequireHttpsMetadata = false;
        x.SaveToken = true;
/* highlight-next-line */
        x.TokenValidationParameters = jwtOptions.ValidationParameters;
    });
}
```

:::note
As you can see [above](#authentication-controller), the `AuthConfig` is also passed to the base `TokenAuthController`, which uses it to create security tokens.
:::

## Cached lookup data

If you have your globally [cached static lookup data](../../../framework/common-ui/lookup), Xomega Framework provides endpoints to get a lookup table by its type from the global cache, or to refresh it in the global cache, in the case when the data for it has changed.

:::note
Usually .NET-based clients that use Xomega Framework can access the lookup tables directly, and the data for those will be loaded automatically from the corresponding sources.

Therefore, these endpoints are useful primarily for other clients, such as JavaScript SPA applications, that need to call REST services to get the lookup data.
:::

### Reading lookup tables

The endpoint to read a lookup table by its type is available under the route `lookup-table/{type}`, as follows.

```
GET https://localhost/lookup-table/operators
```

The results and any errors will use the standard Xomega Framework format for the `Output<LookupTable>` type.

### Refreshing lookup tables

Since the lookup data will be globally cached, you may need to refresh any specific lookup table whenever the data for that table is changed. To do that, your client can use the DELETE HTTP method, as follows.

```
DELETE https://localhost/lookup-table/operators
```

The lookup table `operators` will be reloaded the next time it will be used or requested.

## Client REST service proxies

The best way to call your REST API from .NET-based clients is to create proxy implementations of your business service interfaces, which call the corresponding Web API endpoints, and hide the remote communication from the client.

As explained in the [Xomega Framework service architecture](../common#architecture), this would allow you to use a variety of architectures, where the client presentation logic can call either the remote or the local services, or use a different communication protocol, such as gRPC.

:::tip
Just like with the WebAPI controllers, Xomega.Net for Visual Studio allows you to **generate the REST proxies** for your business services from a Xomega model, so you don't need to write them manually.
:::

### Proxy service clients

To help create service proxies for .NET HTTP clients, Xomega Framework provides a base class `HttpServiceClient` for your service clients, which has a preconfigured instance of the `HttpClient` and provides some utility methods for making REST calls, such as `ToQueryString`.

For each business service exposed via REST, you want to create a corresponding service client class that extends `HttpServiceClient` and implements the service's interface, as follows.

```cs
/* highlight-next-line */
public class SalesOrderServiceClient : HttpServiceClient, ISalesOrderService
{
    protected readonly JsonSerializerOptions SerializerOptions;

    public SalesOrderServiceClient(HttpClient httpClient, IOptionsMonitor<JsonSerializerOptions> options)
        : base(httpClient)
    {
        SerializerOptions = options.CurrentValue;
    }
    ...
}
```

The `httpClient` and `SerializerOptions` will be injected from the DI container, so you want to configure them in your `Startup` class. You can configure JSON serialization options, set the `BaseAddress` for the `HttpClient`, and register your service clients for each business service, as follows.

```cs
public void ConfigureServices(IServiceCollection services)
{
    ...
    // configure serialization options
    services.Configure<JsonSerializerOptions>(o =>
    {
        o.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        o.PropertyNameCaseInsensitive = true;
    });

    // configure HttpClient
    services.AddSingleton(new HttpClient
    {
        BaseAddress = new Uri(apiBaseAddress)
    });

    // register specific service clients
    services.AddScoped<ISalesOrderService, SalesOrderServiceClient>();
    ...
}
```

:::note
The code above uses a singleton `HttpClient` to speed up API connections, but you can also register any function that constructs and configures the `HttpClient` based on your needs.
:::

To make the `Startup` code cleaner, you can also create a separate extension method that registers all service clients, as shown below.

```cs
public static class RestClients
{
/* highlight-next-line */
    public static IServiceCollection AddRestClients(this IServiceCollection services)
    {
        ...
        services.AddScoped<ISalesOrderService, SalesOrderServiceClient>();
        return services;
    }
}
```

This would allow you to register your service proxies with a single line of code in the `Startup` class, as follows.

```cs
services.AddRestClients();
```

### HTTP client authentication

In order to use the registered `HttpClient` for calling secured REST services, it will need to provide an access token. If you use a third-party identity provider, then you can get the token from that provider using its authorization flow, and set it in the *Authorization* header of the registered `HttpClient`.

If you created a custom authentication controller, such as the one that accepts the user name and password described [above](#authentication-controller), then you can create a utility static method `Authenticate` on the client, which would call the `authentication` endpoint with the supplied user name and password, set the resulting JWT token as the default *Authorization* header on the registered `HttpClient`, and return a `ClaimsPrincipal` constructed from that token, as follows.

```cs
public async static Task<ClaimsPrincipal> Authenticate(IServiceProvider serviceProvider,
                                                       string user, string password)
{
    var credentials = new
    {
        Username = user,
        Password = password
    };
    var httpClient = serviceProvider.GetRequiredService<HttpClient>();
    var options = serviceProvider.GetService<IOptionsMonitor<JsonSerializerOptions>>();
/* highlight-start */
    using (var resp = await httpClient.PostAsync("authentication", new StringContent(
        JsonSerializer.Serialize(credentials), Encoding.UTF8, "application/json")))
/* highlight-end */
    {
        var content = await resp.Content.ReadAsStringAsync();
        var res = JsonSerializer.Deserialize<Output<string>>(content, options?.CurrentValue);
        res.Messages.AbortIfHasErrors();

/* highlight-next-line */
        httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {res.Result}");
        var jwtTokenHandler = new JwtSecurityTokenHandler();
        var token = jwtTokenHandler.ReadJwtToken(res.Result);
        var claims = token.Claims.Select(c => new Claim(
            jwtTokenHandler.InboundClaimTypeMap.ContainsKey(c.Type) ?
                jwtTokenHandler.InboundClaimTypeMap[c.Type] : c.Type,
            c.Value, c.ValueType, c.Issuer, c.OriginalIssuer));
/* highlight-next-line */
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
    }
}
```

This way your *Login* dialog will be able to call this method to authenticate the user with a password and set the returned value as the `CurrentPrincipal` on the registered `DefaultPrincipalProvider`.

:::tip
For Blazor WebAssembly you can set it on a custom `AuthenticationStateProvider` instead, and register `AuthStatePrincipalProvider` as the `IPrincipalProvider` during startup, as described [here](../security#wasm).
:::

:::caution
You may still need to handle token expiration, and the logic of refreshing the token, or redirecting the user to the *Login* screen for re-authentication.
:::

### Proxy service operations

For each business service operation, you will need to add an async method that calls the corresponding REST API, deserializes the response, and returns it from the method, as illustrated below.

```cs
/* highlight-next-line */
public async Task<Output<ICollection<SalesOrder_ReadListOutput>>> ReadListAsync(
    SalesOrder_ReadListInput_Criteria _criteria, CancellationToken token = default)
{
    HttpRequestMessage msg = new HttpRequestMessage(HttpMethod.Get,
/* highlight-next-line */
                                                    $"sales-order?{ ToQueryString(_criteria) }");
    using (var resp = await Http.SendAsync(msg, HttpCompletionOption.ResponseHeadersRead, token))
    {
        var content = await resp.Content.ReadAsStreamAsync();
        return await JsonSerializer.DeserializeAsync<Output<ICollection<SalesOrder_ReadListOutput>>>(
            content, SerializerOptions);
    }
}
```

:::note
Note how in the code above, we can use the utility method `ToQueryString` provided by the base class.
:::

If your operation updates the data, then you should use the proper HTTP method, and serialize the data as JSON in the request body, as follows.

```cs
/* highlight-next-line */
public async Task<Output<SalesOrder_UpdateOutput>> UpdateAsync(
    int _salesOrderId, SalesOrder_UpdateInput_Data _data, CancellationToken token = default)
{
    HttpRequestMessage msg = new HttpRequestMessage(HttpMethod.Put, $"sales-order/{ _salesOrderId }")
    {
/* highlight-next-line */
        Content = new StringContent(JsonSerializer.Serialize(_data), Encoding.UTF8, "application/json")
    };
    using (var resp = await Http.SendAsync(msg, HttpCompletionOption.ResponseHeadersRead, token))
    {
        var content = await resp.Content.ReadAsStreamAsync();
        return await JsonSerializer.DeserializeAsync<Output<SalesOrder_UpdateOutput>>(
            content, SerializerOptions);
    }
}
```

:::warning
You should provide implementations for **all business service operations** here. If any of them are not exposed via REST API, then you will need to throw a `NotSupportedException`.
:::
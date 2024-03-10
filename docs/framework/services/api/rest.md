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

You can configure these controllers in the startup class of your web application using the standard ASP.NET Core mechanisms, as illustrated below.

```cs
var builder = WebApplication.CreateBuilder(args);
var services = builder.Services;

/* highlight-next-line */
services.AddControllers(o => o.Filters.Add(new AuthorizeFilter()));
...
var app = builder.Build();
/* highlight-next-line */
app.MapControllers();
...
app.Run();
```

### API path prefix

If you host your Web API with your web application, e.g. in the main Blazor project, rather than as a standalone project, then you can also configure a path prefix for all controllers, such as `api/`, so that controller actions would not clash with the routes to the web application views.

For example, you can define the API path prefix in the `RestAPI:Path` configuration and configure the controllers to use that prefix as follows.

```cs
var builder = WebApplication.CreateBuilder(args);
var services = builder.Services;

/* highlight-next-line */
string apiPath = builder.Configuration.GetValue<string>("RestAPI:Path");

services.AddControllers(o =>
{
    o.Filters.Add(new AuthorizeFilter());
/* highlight-next-line */
    o.UseGeneralRoutePrefix(apiPath);
})
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

:::warning
While ASP.NET Core does support synchronous methods, make sure that you **use async methods** for both your actions and service operations.
:::

## Unhandled errors

While you can properly report any exceptions in the current error list using a `try/catch` in each action, there may be still unhandled exceptions raised by the ASP.NET Core middleware. If you also want to report them in a standardized way through an [error list](../errors#list), then Xomega Framework provides a special `ErrorController` for that, which you can register as the global exception handler in your startup class, as follows.

```cs
// configure global exception handling using Xomega Framework
/* highlight-next-line */
app.UseExceptionHandler(ErrorController.DefaultPath);
```

:::note
You can also rely on this global exception handler instead of adding a `try/catch` in every controller action, but the latter provides you with more flexibility to handle caught exceptions in a custom way.
:::

## WebAPI authentication

When exposing your services via a REST API you want to make sure that your WebAPI is secured and allows access only to authenticated users. For web-based clients, such as Blazor WebAssembly or a JavaScript-based SPA, you can configure cookie-based authentication, allowing the browser to secure the authentication cookie on the client.

For non-browser clients, such as a WPF desktop client or a mobile app, the typical authentication mechanism for REST APIs is by providing a *Bearer* token in the *Authorization* header, such as a JWT token. The client will need to make sure that the token is secure and is not accessible to unauthorized users or programs.

### Cookie authentication

To enable cookie-based authentication you can create a special `AuthController` with a method `AuthCookieAsync` that validates the users and then signs them in using the cookie authentication scheme.

The following code block demonstrates implementation of an `AuthController` for cookie-based authentication using a password login.

```cs title='AuthController.cs'
[ApiController]
[AllowAnonymous]
[Route("auth")]
public class AuthController(IPasswordLoginService loginService,
    IPrincipalConverter<UserInfo> principalConverter,
    ErrorList errorList, ErrorParser errorParser) : BaseController(errorList, errorParser)
{
    [HttpPost]
    [Route("cookie")]
    public async Task<ActionResult> AuthCookieAsync(
        [FromBody] PasswordCredentials credentials, CancellationToken token)
    {
        try
        {
            if (!ModelState.IsValid)
                currentErrors.AddModelErrors(ModelState);
            currentErrors.AbortIfHasErrors();

/* highlight-next-line */
            var res = await loginService.LoginAsync(credentials, token);
            res.Messages.AbortIfHasErrors();
            UserInfo userInfo = res.Result;
            userInfo.AuthenticationType = CookieAuthenticationDefaults.AuthenticationScheme;

            var principal = principalConverter.ToPrincipal(userInfo);
/* highlight-next-line */
            await HttpContext.SignInAsync(principal);
            return StatusCode((int)currentErrors.HttpStatus, new Output<UserInfo>(currentErrors, userInfo));
        }
        catch (Exception ex)
        {
            currentErrors.MergeWith(errorsParser.FromException(ex));
        }
        return StatusCode((int)currentErrors.HttpStatus, new Output(currentErrors));
    }
}
```

The above code calls a separate `IPasswordLoginService` to authenticate the user with `PasswordCredentials`, then converts the resulting `UserInfo` to a `ClaimsPrincipal` using an implementation of the framework's interface `IPrincipalConverter<UserInfo>`, and finally calls the `HttpContext.SignInAsync` to sign in the user with a cookie.

### Token authentication

When exposing your services via a REST API you want to make sure that your WebAPI is secured and allows access only to authenticated users. The typical authentication mechanism for REST APIs is by providing a *Bearer* token in the *Authorization* header, such as a JWT token.

The token can be created either by a trusted issuer, such as your identity provider or by the WebAPI application itself, which would be able to populate application-specific claims for the current user. Xomega Framework can help you implement authentication endpoints that can issue access tokens, as described below.

:::tip
For secure production systems we recommend using a certified third-party identity provider and setting up your Web API to trust the tokens issued by that provider, e.g with OAuth or OpenID Connect.
:::

#### AuthToken

Xomega Framework defines a special class `AuthToken` that contains the following two string fields:
- `AccessToken` - a short-lived JWT that is used to access the WebAPI and is sent in the *Authorization* header as the *Bearer* token.
- `RefreshToken` - a longer-lived token stored on the user profile, which allows to get a new access token whenever the current access token expires.

This allows you to implement **security best practices** for your application, where access tokens are short-lived and therefore are less vulnerable to being compromised. On the other hand, the refresh token stored on the user profile allows you to reset it, thereby forcing authenticated users to login again as soon as their access token expires.

#### JWT auth controller

To help you implement a controller for issuing and refreshing JWT auth tokens, Xomega Framework provides a base class `JwtAuthController`. Below is an example of the implementation of an `AuthController` that authenticates the user with password credentials and issues JWT auth tokens.

```cs title='AuthController.cs'
[ApiController]
[AllowAnonymous]
[Route("auth")]
public class AuthController(IPasswordLoginService loginService,
        IPrincipalConverter<UserInfo> principalConverter,
        IOptionsMonitor<JwtBearerOptions> jwtOptMon, ErrorList errorList, ErrorParser errorParser
/* highlight-next-line */
    ) : JwtAuthController(jwtOptMon, errorList, errorParser)
{

    [HttpPost]
    [Route("jwt")]
    public async Task<ActionResult> AuthJwtAsync(
        [FromBody] PasswordCredentials credentials, CancellationToken token)
    {
        try
        {
            if (!ModelState.IsValid)
                currentErrors.AddModelErrors(ModelState);
            currentErrors.AbortIfHasErrors();

/* highlight-next-line */
            var res = await loginService.LoginAsync(credentials, token);
            res.Messages.AbortIfHasErrors();
            UserInfo userInfo = res.Result;
            userInfo.AuthenticationType = JwtBearerDefaults.AuthenticationScheme;

            var principal = principalConverter.ToPrincipal(userInfo);
/* highlight-next-line */
            AuthToken authToken = await GenerateAuthTokenAsync(principal.Identity as ClaimsIdentity, token);

            return StatusCode((int)currentErrors.HttpStatus, new Output<AuthToken>(currentErrors, authToken));
        }
        catch (Exception ex)
        {
            currentErrors.MergeWith(errorsParser.FromException(ex));
        }
        return StatusCode((int)currentErrors.HttpStatus, new Output(currentErrors));
    }
}
```

Similar to the [cookie authentication example](#cookie-authentication), our controller uses an injected `IPasswordLoginService` to perform the password authentication, and a `IPrincipalConverter<UserInfo>` to convert the resulting user info to a `ClaimsPrincipal`.

:::note
We call `res.Messages.AbortIfHasErrors()` just in case the `loginService.LoginAsync` does not abort on authentication errors, so as to ensure that any errors will be added to the `currentErrors`.
:::

#### Generating auth tokens

To generate an `AuthToken` from the principal's identity we call a separate method `GenerateAuthTokenAsync` on the controller as illustrated below.

```cs title='AuthController.cs'
protected async Task<AuthToken> GenerateAuthTokenAsync(ClaimsIdentity identity, CancellationToken token)
{
    string refreshToken = GenerateRefreshToken();

    await Task.CompletedTask; // TODO: store the refreshToken for the current user

    return GenerateAuthToken(identity, refreshToken);
}
```

This method leverages the base class' methods to generate a refresh token and use it, along with the passed identity, to generate an auth token. After generating a refresh token you should also store it in the database for the user - whether in the standard ASP.NET Identity tables or in a custom user table.

The base method `GenerateAuthToken` optionally allows you to specify the number of minutes for the access token expiration. The default value is 15 minutes, but you can reduce it for testing purposes or increase it as needed.

#### Refresh tokens

In addition to an action for issuing auth tokens you also need to provide an endpoint for refreshing tokens that have expired or are about to expire. The base class provides a helper method `ValidateExpiredToken` to validate an expired JWT, which allows the client to refresh their JWT after it has expired, such as upon receiving a 401 response from the API.

Below is a sample implementation of a token refresh endpoint.

```cs title='AuthController.cs'
[HttpPost]
[Route("refresh")]
public async Task<ActionResult> RefreshJwtAsync([FromBody] AuthToken authToken, CancellationToken token)
{
    try
    {
        if (!ModelState.IsValid)
            currentErrors.AddModelErrors(ModelState);

        // validate expired access token
/* highlight-next-line */
        var identity = ValidateExpiredToken(authToken.AccessToken) ??
            throw new SecurityTokenException("Invalid access token");

        if (!await IsRefreshTokenValidAsync(identity, authToken.RefreshToken, token))
            throw new SecurityTokenException("Invalid refresh token");

/* highlight-next-line */
        AuthToken newAuthToken = await GenerateAuthTokenAsync(identity, token);

        return StatusCode((int)currentErrors.HttpStatus, new Output<AuthToken>(currentErrors, newAuthToken));
    }
    catch (Exception ex)
    {
        currentErrors.MergeWith(errorsParser.FromException(ex));
    }
    return StatusCode((int)currentErrors.HttpStatus, new Output(currentErrors));
}

/* highlight-next-line */
protected async Task<bool> IsRefreshTokenValidAsync(
    ClaimsIdentity identity, string refreshToken, CancellationToken token)
{
    // TODO: validate the provided refreshToken for the current user
    return await Task.FromResult(true);
}
```

The above example validates the refresh token in a separate method `IsRefreshTokenValidAsync`, where you should use the provided identity to find the current refresh token for the user, and then compare it to the provided refresh token.

#### JWT configuration

To configure the JWT authentication in your WebAPI, you can specify the audience, the issuer and a signing key in the application config using the standard schema, as follows.

```json title='appsettings.json'
{
  "Authentication": {
    "Schemes": {
      "Bearer": {
        "ValidAudience": "Anyone",
        "ValidIssuer": "My REST API",
        "SigningKeys": [
          {
            "Issuer": "My REST API",
            // Base64-encoded signing key for JWT tokens that should be provided by the environment
            "Value": "D7TMBWn9XGg6ANv6Sswseq2n/TaB0au5MLedSzaXqU4="
          }
        ]
      }
    }
  }
}
```

:::warning
You should not store signing keys in the `appsettings.json` for a running API, but provide it from the environment or a key vault.
:::

The standard configuration above will allow you to set up JWT authentication in your main `Program` file with little to no additional options, as shown below.

```cs title='Program.cs'
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
```

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

The best way to call your REST API from .NET-based clients is to create proxy implementations of your business service interfaces, which call the corresponding WebAPI endpoints, and hide the remote communication from the client.

As explained in the [Xomega Framework service architecture](../common#architecture), this would allow you to use a variety of architectures, where the client presentation logic can call either the remote or the local services, or use a different communication protocol, such as gRPC.

:::tip
Just like with the WebAPI controllers, Xomega.Net for Visual Studio allows you to **generate the REST proxies** for your business services from a Xomega model, so you don't need to write them manually.
:::

### Client REST API config

Xomega Framework provides a class `RestApiConfig` that allows you to configure your REST API clients for calling your WebAPI. You can specify the values for this configuration in your `appsettings.json` as follows.

```json title='appsettings.json'
{
  "RemoteApi": {    
    "ClientName": "remote",
    "BaseAddress": "https://localhost:44371",
    "BasePath": "",
    "Authorization": "true",
    "RefreshTokenPath": "auth/refresh"
  }
}
```

You can give the API config section any name and specify the following parameters.
- `ClientName` - to configure a named `HttpClient`.
- `BaseAddress` - remote API address or blank, if API is co-hosted with the web app.
- `BasePath` - base path for the API, e.g. "api", if the API is co-hosted with the web app or other APIs.
- `Authorization` - `true` to use [JWT authorization](#token-authentication) for the API client, `false` for cookie-based auth.
- `RefreshTokenPath` - path to the endpoint for [refreshing JWT auth tokens](#refresh-tokens).

Once you define your `RestApiConfig`, you can read it from the configuration and call the `AddRestServices` to configure REST service clients. You also need to add it as a singleton to the DI container to allow other services to access API configuration. The following code demonstrates this setup.

```cs title='Program.cs'
var apiConfig = builder.Configuration.GetSection("RemoteApi").Get<RestApiConfig>();
if (string.IsNullOrEmpty(apiConfig.BaseAddress))
    apiConfig.BaseAddress = builder.HostEnvironment.BaseAddress;
services.AddRestServices(apiConfig);
services.AddSingleton(apiConfig);
```

:::note
If the API base address is blank in the configuration, you need to set it from the `HostEnvironment`, as shown above.
:::

### Proxy service clients

To help create service proxies for .NET HTTP clients, Xomega Framework provides a base class `RestApiClient` for your service clients, which provides the `HttpClient` property `Http` for making REST calls, as well as some utility methods, such as `ToQueryString`.

For each business service exposed via REST, you want to create a corresponding service client class that extends `RestApiClient` and implements the service's interface, as follows.

```cs
/* highlight-next-line */
public class SalesOrderServiceClient : RestApiClient, ISalesOrderService
{
    public SalesOrderServiceClient(IHttpClientFactory httpClientFactory, RestApiConfig apiConfig,
        IOptionsMonitor<JsonSerializerOptions> serializerOptions, ResourceManager resourceManager)
        : base(httpClientFactory, apiConfig, serializerOptions, resourceManager)
    {
    }
    ...
}
```

For each business service you need to register your service clients with the DI container, as follows.

```cs
// register specific service clients
services.AddScoped<ISalesOrderService, SalesOrderServiceClient>();
```

To make the startup code cleaner, you can also create a separate extension method that registers all service clients, as shown below.

```cs
public static class RestClients
{
/* highlight-next-line */
    public static IServiceCollection AddRestClients(this IServiceCollection services)
    {
        ...
        services.TryAddScoped<ISalesOrderService, SalesOrderServiceClient>();
        return services;
    }
}
```

This would allow you to register your service proxies with a single line of code in the startup class, as follows.

```cs
services.AddRestClients();
```

### Client cookie authentication

If your REST API uses cookie authentication, then before calling any secure endpoints you need to call a [cookie authentication endpoint](#cookie-authentication), which would set the authentication cookie and return the user info for the current user.

To be able to use the returned user info for security checks on the client, you need to convert it to a `ClaimsPrincipal` using the configured `IPrincipalConverter<UserInfo>`, and then set it as the `CurrentPrincipal` on the current `IPrincipalProvider`. The following class demonstrates cookie authentication on the client side using password credentials.

```cs
public class CookieLoginServiceClient : RestApiClient
{
    private readonly IPrincipalConverter<UserInfo> principalConverter;
    private readonly IPrincipalProvider principalProvider;

    public CookieLoginServiceClient(IHttpClientFactory httpClientFactory, RestApiConfig apiConfig,
        IOptionsMonitor<JsonSerializerOptions> serializerOptions, ResourceManager resourceManager,
/* highlight-next-line */
        IPrincipalConverter<UserInfo> principalConverter, IPrincipalProvider principalProvider)
        : base(httpClientFactory, apiConfig, serializerOptions, resourceManager)
    {
        this.principalConverter = principalConverter;
        this.principalProvider = principalProvider;
    }

    public async Task<Output<UserInfo>> LoginAsync(PasswordCredentials _credentials, CancellationToken token)
    {
/* highlight-next-line */
        using (var resp = await Http.PostAsync("auth/cookie", new StringContent(
            JsonSerializer.Serialize(_credentials, SerializerOptions), Encoding.UTF8, "application/json")))
        {
            var res = await resp.Content.ReadFromJsonAsync<Output<UserInfo>>(token);
            if (res.Result != null)
/* highlight-next-line */
                principalProvider.CurrentPrincipal = principalConverter.ToPrincipal(res.Result);
            return res;
        }
    }
}
```

:::note
If your client is WebAssembly, then you need to configure it to use the same instance of `PrincipalAuthStateProvider` for both the `AuthenticationStateProvider` and `IPrincipalProvider`, as described [here](../security#wasm). This way, setting the current principal above will also refresh the authentication state for WebAssembly.
:::

### Client JWT authentication

If your REST API uses JWT authentication, then before calling any secure endpoints you need to call a [token authentication endpoint](#jwt-auth-controller), which would return an `AuthToken` consisting of a JWT and a refresh token. To configure the REST clients with the new JWT and to set up security on the client, you need to call the `SetAuthTokenAsync` on the currently configured `ITokenService`.

The `JwtTokenService` implementation of `ITokenService` will use the new JWT for any REST API calls, and also constructs a `ClaimsPrincipal` from it, which it sets on the current `IPrincipalProvider`. It also automatically [refreshes expired JWT tokens](#refresh-tokens) and throws a `Login_SessionExpired` security message if it fails to do so, which should redirect the user to the login screen.

:::tip
An instance of a `JwtTokenService` will be configured automatically when you call `services.AddRestServices(apiConfig)` and your `apiConfig` has `Authorization` set to `true`. You can also override it with your custom class, such as to provide a custom implementation of the `RedirectToLogin` method.
:::

The following class demonstrates JWT authentication on the client side using password credentials.

```cs
public class JwtLoginServiceClient : RestApiClient
{
    private readonly ITokenService tokenService;

    public JwtLoginServiceClient(IHttpClientFactory httpClientFactory, RestApiConfig apiConfig,
        IOptionsMonitor<JsonSerializerOptions> serializerOptions, ResourceManager resourceManager,
/* highlight-next-line */
        ITokenService tokenService)
        : base(httpClientFactory, apiConfig, serializerOptions, resourceManager)
    {
        this.tokenService = tokenService;
    }

    public async Task<Output> LoginAsync(PasswordCredentials _credentials, CancellationToken token)
    {
/* highlight-next-line */
        using (var resp = await Http.PostAsync("auth/jwt", new StringContent(
            JsonSerializer.Serialize(_credentials, SerializerOptions), Encoding.UTF8, "application/json")))
        {
            var res = await resp.Content.ReadFromJsonAsync<Output<AuthToken>>(token);
            if (res.Result != null)
/* highlight-next-line */
                var identity = await tokenService.SetAuthTokenAsync(res.Result);
            return new Output(res.Messages);
        }
    }
}
```

:::note
If your client is WebAssembly, then you need to configure it to use the same instance of `PrincipalAuthStateProvider` for both the `AuthenticationStateProvider` and `IPrincipalProvider`, as described [here](../security#wasm). This way, when the `tokenService` above sets the current principal as part of `SetAuthTokenAsync`, it will also refresh the authentication state for WebAssembly.
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
        var content = await ReadOutputContentAsync(resp);
        return JsonSerializer.Deserialize<Output<ICollection<SalesOrder_ReadListOutput>>>(
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
        var content = await ReadOutputContentAsync(resp);
        return JsonSerializer.Deserialize<Output<SalesOrder_UpdateOutput>>(content, SerializerOptions);
    }
}
```

:::danger
You should provide implementations for **all business service operations** here. If any of them are not exposed via REST API, then you will need to throw a `NotSupportedException`.
:::
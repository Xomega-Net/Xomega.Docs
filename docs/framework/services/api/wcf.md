---
sidebar_position: 7
---

# WCF Services

If you have existing infrastructure and systems that require legacy communication protocols, such as SOAP, then you can expose your business services via WCF.

:::warning
WCF is a legacy communication framework that is available only on .NET Framework. Apparently, there are no plans by Microsoft to make it available on .NET 6 and ASP.NET Core, so you should use it only if this is required by your legacy systems.
:::

:::tip
Xomega.Net for Visual Studio provides support for exposing business services via WCF and can create a WCF project for you that is pre-configured for secure WCF services.
:::

## Enabling DI in WCF

By default, the WCF framework doesn't provide any built-in support for dependency injection (DI). Given that all business services need to use the DI, Xomega Framework enhances WCF to add DI support to it. Below is how to enable it for your WCF services.

### Define AppInitializer

Xomega Framework defines a class `AppInitializer` with an abstract method `ConfigureServices`. You will need to create a subclass of this class in your WCF project, and implement the `ConfigureServices` method similar to the ones you'd use in the regular startup classes of the ASP.NET Core applications, as follows.

```cs
/* highlight-next-line */
public class WcfAppInit : AppInitializer
{
    public override IServiceProvider ConfigureServices()
    {
        IServiceCollection services = new ServiceCollection();

        services.AddErrors(true);
        services.AddScoped<IPrincipalProvider, DefaultPrincipalProvider>();
        services.AddServiceImplementations();
        ...

        return services.BuildServiceProvider();
    }
}
```

:::note
As we mentioned [earlier](../security#wcf), you should register a scoped `DefaultPrincipalProvider` as `IPrincipalProvider` for securing business services. Also, the `AddServiceImplementations` would be your custom extension method, as described [here](../common#service-registrations).
:::

### Register AppInitializer

Next, you'll need to register your app initializer class in the `appSettings` section of your WCF project's `Web.config` file. You should register it under the key `xomfwk:AppInitializer` and use a fully qualified type name with the assembly name, as follows.

```xml title="Web.config"
<appSettings>
  <add key="aspnet:UseTaskFriendlySynchronizationContext" value="true"/>
<!-- highlight-next-line -->
  <add key="xomfwk:AppInitializer" value="MyProject.Services.Wcf.WcfAppInit, MyProject.Services.Wcf"/>
</appSettings>
```

### Use DI-based host factory

Now, in order to enable DI for any of the WCF services that you expose, you should use the Xomega Framework's DI-based host factory in your service host files, as follows.

```xml title="Sales/SalesOrderService.svc"
<%@ ServiceHost Service="MyProject.Services.Entities.SalesOrderService" Language="C#"
<!-- highlight-next-line -->
                Factory="Xomega.Framework.Wcf.DefaultServiceProviderHostFactory" %>
```

## WCF-enabled services

Enabling WCF will require you to slightly change the way your business services are described, as explained below.

### WCF attributes

You will need to decorate your service interfaces and DTOs with WCF attributes, such as `ServiceContract` and `DataContract`, as illustrated below.

```cs
/* highlight-next-line */
[ServiceContract]
public interface ISalesOrderService
{
/* highlight-next-line */
    [OperationContract]
    Task<Output<SalesOrder_ReadOutput>> ReadAsync(int _salesOrderId);
    ...
}

/* highlight-next-line */
[DataContract]
public class SalesOrder_ReadOutput
{
/* highlight-next-line */
    [DataMember]
    public DateTime OrderDate { get; set; }
    ...
}
```

:::tip
There are tons of WCF attributes that allow you to fine-tune the execution of WCF services, such as serialization, transactions, security, specific service behaviors, etc.
:::

### Service model configuration

As required by WCF, you should configure your business service implementations under the `services` section of the `system.serviceModel` configuration. For secure communication, you want to use `ws2007FederationHttpBinding`.

If your services will be using transport security (i.e. HTTPS with SSL), then you can define and use a `mixed` binding with `TransportWithMessageCredential` security mode.

:::note
With WCF you also have the option to use plain HTTP, in which case you'll need to use the `message` binding that encrypts the entire message.
:::

You can also configure other WCF service behaviors, such as service credentials, authorization, etc. The following snippet demonstrates such a configuration.

```xml
<system.serviceModel>
  <behaviors>
    <serviceBehaviors>
      <behavior>
        <!-- To avoid disclosing metadata information, set the values below to false before deployment -->
        <serviceMetadata httpGetEnabled="true" httpsGetEnabled="true"/>
        <!-- To receive exception details in faults for debugging purposes, set the value below to true.
              Set to false before deployment to avoid disclosing exception information -->
        <serviceDebug includeExceptionDetailInFaults="true"/>
<!-- highlight-start -->
        <serviceCredentials useIdentityConfiguration="true">
          <serviceCertificate storeName="My" storeLocation="LocalMachine"
                              x509FindType="FindBySubjectName" findValue="localhost"/>
        </serviceCredentials>
        <serviceAuthorization principalPermissionMode="Always"/>
<!-- highlight-end -->
        <dataContractSerializer maxItemsInObjectGraph="1048575"/>
      </behavior>
    </serviceBehaviors>
  </behaviors>
  <bindings>
    <ws2007FederationHttpBinding>
<!-- highlight-start -->
      <binding name="mixed" maxReceivedMessageSize="2147483647">
        <security mode="TransportWithMessageCredential">
          <message establishSecurityContext="false" issuedKeyType="BearerKey"/>
        </security>
      </binding>
<!-- highlight-end -->
    </ws2007FederationHttpBinding>
  </bindings>
  <serviceHostingEnvironment multipleSiteBindingsEnabled="true"/>
  <services>
<!-- highlight-start -->
    <service name="MyProject.Services.Entities.SalesOrderService">
      <endpoint address="" binding="ws2007FederationHttpBinding"
                contract="MyProject.Services.Common.ISalesOrderService"
                bindingConfiguration="mixed"/>
<!-- highlight-end -->
      <endpoint address="mex" binding="mexHttpBinding" contract="IMetadataExchange"/>
    </service>
  </services>
</system.serviceModel>
```

### Async operations

While WCF was initially designed for synchronous operations, it does support async operations as well. To make it work you will need to set the `aspnet:UseTaskFriendlySynchronizationContext` flag to `true` in your `appSettings` config section, as follows.

```xml title="Web.config"
  <appSettings>
<!-- highlight-next-line -->
    <add key="aspnet:UseTaskFriendlySynchronizationContext" value="true"/>
    ...
  </appSettings>
```

:::warning
Asynchronous operations in WCF **don't support cancellation tokens**, so you'll need to remove the `CancellationToken` arguments from your operations.
:::

## Securing WCF API

Any business services that you expose via WCF should be secured, and allow authenticated users only. WCF uses `System.IdentityModel` as well as the Claims Identity in order to provide authentication and authorization for the requests.

:::caution
Securing WCF services could be a daunting task, especially if you are not very familiar with the Identity Model.
:::

To enable authentication using federated security you need to create a custom Security Token Service (STS) in your WCF project, which will issue security tokens based on user credentials, which could range from basic user/password to another token issued by a trusted provider.

### STS Configuration

First of all, you want to create a DI-enabled STS configuration, which accepts an `IServiceProvider`, and stores it to make it available to its STS. In your STS config, you should configure the signing credentials by reading a certificate from the local store that is used for signing. You should also set the `SecurityTokenService` to the type of [your STS class](#sts), as follows.

```cs
public class AppStsConfig : SecurityTokenServiceConfiguration
{
    public IServiceProvider ServiceProvider { get; private set; }

/* highlight-next-line */
    public AppStsConfig(IServiceProvider svcProvider)
    {
        ServiceProvider = svcProvider;
        string signingCertPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Sts/LocalSTS.pfx");
        X509Certificate2 signingCert = new X509Certificate2(signingCertPath,
                                                            "LocalSTS", X509KeyStorageFlags.PersistKeySet);
        // read signing certificate from a store in production
        X509Store store = new X509Store(StoreName.My, StoreLocation.LocalMachine);
        store.Open(OpenFlags.ReadOnly);
        var certs = store.Certificates.Find(X509FindType.FindBySubjectName, "localhost", false);
        store.Close();
        if (certs.Count > 0) signingCert = certs[0];

/* highlight-next-line */
        SigningCredentials = new X509SigningCredentials(signingCert);
        ServiceCertificate = signingCert;
        TokenIssuerName = "MyProject/STS";
/* highlight-next-line */
        SecurityTokenService = typeof(AppSts);
    }
}
```

Next, you should configure the identity model to trust your signing certificate in the `Web.config` by specifying its thumbprint, as follows.

```xml title="Web.config"
<system.identityModel>
  <identityConfiguration saveBootstrapContext="true">
    ...
    <issuerNameRegistry type="System.IdentityModel.Tokens.ConfigurationBasedIssuerNameRegistry, System.IdentityModel, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089">
      <trustedIssuers>
<!-- highlight-next-line -->
        <add thumbprint="[signing certificate thumbprint]" name="LocalSTS"/>
      </trustedIssuers>
    </issuerNameRegistry>
    <!-- turn off certificate validation only for testing with local certs
         that are not issued by a trusted authority -->
    <certificateValidation certificateValidationMode="None"/>
  </identityConfiguration>
</system.identityModel>
```

To issue security tokens, you should also expose your STS config in the service host file using the Xomega Framework's `DefaultServiceProviderHostFactory`, as follows.

```xml title="Sts/Issuer.svc"
<%@ ServiceHost Service="MyProject.Services.Wcf.AppStsConfig" Language="C#"
                Factory="Xomega.Framework.Wcf.DefaultServiceProviderHostFactory" %>
```

### Security token service{#sts}

Now you need to create your STS class that extends from the `SecurityTokenService` class, and implement the following methods:
- `GetOutputClaimsIdentity`, which constructs a claims identity for the authenticated user, using the app-specific claims, and
- `GetScope`, which constructs a scope for the issued token, based on the current WCF app.

:::tip
You can cast the current STS configuration to your custom class and use its service provider to access any services for constructing the claims identity.
:::

The following snippet illustrates such an STS implementation. 

```cs
public class AppSts : SecurityTokenService
{
    public AppSts(SecurityTokenServiceConfiguration config) : base(config)
    {
    }

/* highlight-next-line */
    protected override ClaimsIdentity GetOutputClaimsIdentity(
        ClaimsPrincipal principal, RequestSecurityToken request, Scope scope)
    {
        if (principal == null) throw new InvalidRequestException("The caller's principal is null.");
/* highlight-start */
        AppStsConfig cfg = SecurityTokenServiceConfiguration as AppStsConfig;
        if (cfg == null)
            throw new InvalidOperationException("SecurityTokenServiceConfiguration should be AppStsConfig");
/* highlight-end */
        if (!principal.Identity.IsAuthenticated || principal.Identity.Name == null)
            throw new UnauthorizedAccessException("User is not authorized.");

        try
        {
/* highlight-next-line */
            // TODO: construct user identity here. Use cfg.ServiceProvider to access any services
            ClaimsIdentity ci = new ClaimsIdentity(principal.Identity.AuthenticationType);
            ci.AddClaim(new Claim(ClaimTypes.NameIdentifier, principal.Identity.Name));
            ci.AddClaim(new Claim(ClaimTypes.Name, principal.Identity.Name));
            return ci;
        }
        catch (Exception ex)
        {
            ErrorParser errorParser = cfg.ServiceProvider.GetService<ErrorParser>();
            ErrorList errors = errorParser.FromException(ex);
            throw new RequestFailedException(errors.ErrorsText, ex);
        }
    }

/* highlight-next-line */
    protected override Scope GetScope(ClaimsPrincipal principal, RequestSecurityToken request)
    {
        if (request.AppliesTo == null) throw new InvalidRequestException("The AppliesTo is null.");

        Scope scope = new Scope(request.AppliesTo.Uri.OriginalString,
                                SecurityTokenServiceConfiguration.SigningCredentials);
        scope.TokenEncryptionRequired = false;
        scope.SymmetricKeyEncryptionRequired = false;
        scope.ReplyToAddress = (string.IsNullOrEmpty(request.ReplyTo)) ?
                                scope.AppliesToAddress : request.ReplyTo;
        return scope;
    }
}
```

This will configure your STS which can issue security tokens (SAML). Now you need to define STS endpoints for each authentication method that your STS accepts to issue an access token.

### Password authentication

Let's consider a basic scenario, where your STS can issue a token using the user name and password authentication over a secure HTTPS connection. For this, you will need to define a `mixed` binding of type `ws2007HttpBinding` in your service model configuration using a `TransportWithMessageCredential` security mode, and credential type of `UserName`.

Then you should add a service `WSTrustServiceContract` with an endpoint for the `IWSTrust13SyncContract` using your `mixed` binding configuration, and give it a distinct address.

:::tip
If you place your STS service host `Issuer.svc` in a dedicated folder, e.g. *Sts*, then you can put these configurations in a separate `Web.config` file in that folder, as shown below.
:::

```xml title="Sts/Web.config"
<configuration>
  <system.serviceModel>
    <behaviors>
      <serviceBehaviors>
        <behavior>
          <serviceCredentials useIdentityConfiguration="true"/>
        </behavior>
      </serviceBehaviors>
    </behaviors>
    <bindings>
      <ws2007HttpBinding>
<!-- highlight-start -->
        <binding name="mixed">
          <security mode="TransportWithMessageCredential">
            <transport clientCredentialType="None" />
            <message clientCredentialType="UserName" establishSecurityContext="false" />
          </security>
        </binding>
<!-- highlight-end -->
      </ws2007HttpBinding>
    </bindings>
    <services>
<!-- highlight-next-line -->
      <service name="System.ServiceModel.Security.WSTrustServiceContract">
<!-- highlight-start -->
        <endpoint address="mixed/username"
                  binding="ws2007HttpBinding" bindingConfiguration="mixed"
                  contract="System.ServiceModel.Security.IWSTrust13SyncContract"/>
<!-- highlight-end -->
      </service>
    </services>
  </system.serviceModel>
</configuration>
```

In order to implement a custom validation of the user name and password, you would need to create a `UserNameValidator` class that extends `UserNameSecurityTokenHandler` and validates the user and password against your database in the `ValidateToken` method.

You can access your business services registered in the DI container by using the static `DI.DefaultServiceProvider` in Xomega Framework. The following example illustrates an implementation of such a user name validator without the actual validation logic.

```cs
/* highlight-next-line */
public class UserNameValidator : UserNameSecurityTokenHandler
{
    public override bool CanValidateToken => true;

/* highlight-next-line */
    public override ReadOnlyCollection<ClaimsIdentity> ValidateToken(SecurityToken token)
    {
        if (!(token is UserNameSecurityToken userNameToken))
            throw new SecurityTokenException("The security token is not a valid username security token.");

        if (DI.DefaultServiceProvider == null)
            throw new InvalidOperationException("Default service provider is not initialized.");

        try
        {
/* highlight-next-line */
            // TODO: validate UserName and Password from userNameToken here. 
            // Use DI.DefaultServiceProvider to access any services for that.
            ClaimsIdentity identity = new ClaimsIdentity(AuthenticationTypes.Password);
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, userNameToken.UserName));
            identity.AddClaim(new Claim(ClaimTypes.Name, userNameToken.UserName));
            return Array.AsReadOnly(new[] { identity });
        }
        catch (Exception ex)
        {
            ErrorParser errorParser = DI.DefaultServiceProvider.GetService<ErrorParser>();
            ErrorList errors = errorParser.FromException(ex);
            throw new SecurityTokenException(errors.ErrorsText, ex);
        }
    }
}
```

Finally, to register your custom `UserNameValidator`, you need to update the root `Web.config` to remove the default `WindowsUserNameSecurityTokenHandler`, and add your custom token handler using a fully qualified type with the assembly name, as follows.

```xml title="Web.config"
<system.identityModel>
  <identityConfiguration saveBootstrapContext="true">
    ...
    <securityTokenHandlers>
      <remove type="System.IdentityModel.Tokens.WindowsUserNameSecurityTokenHandler,System.IdentityModel, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"/>
<!-- highlight-next-line -->
      <add type="MyProject.Services.Wcf.UserNameValidator, MyProject.Services.Wcf"/>
    </securityTokenHandlers>
  </identityConfiguration>
</system.identityModel>
```

This will allow your WCF services app to issue a security access token for the WCF services using the basic user name and password authentication.

## WCF client app

Once you have a secure WCF app with an STS that allows issuing tokens using password authentication, your client app can present a *Login* form at the start to collect the user name and password, use those to call the STS and get an access token, which it would further use to access any business services exposed via WCF.

### Registering WCF client proxies

If your client app is based on the Xomega Framework, e.g. WPF, then you need to make sure it has DI enabled, and then register WCF client proxies as services with the DI container. Xomega Framework makes it easy based on the client configuration of your service model.

First of all, you need to set up the service model config of your client app with the same `mixed` bindings as you use for the WCF services and specify client endpoints for the STS and each exposed business service, as follows.

```xml title="App.config"
<configuration>
  <system.serviceModel>
    <bindings>
<!-- highlight-start -->
      <ws2007HttpBinding>
        <binding name="mixed">
<!-- highlight-end -->
          <security mode="TransportWithMessageCredential">
            <transport clientCredentialType="None"/>
            <message clientCredentialType="UserName" establishSecurityContext="false"/>
          </security>
        </binding>
      </ws2007HttpBinding>
<!-- highlight-start -->
      <ws2007FederationHttpBinding>
        <binding name="mixed" maxReceivedMessageSize="2147483647">
<!-- highlight-end -->
          <security mode="TransportWithMessageCredential">
            <message establishSecurityContext="false" issuedKeyType="BearerKey" />
          </security>
        </binding>
      </ws2007FederationHttpBinding>
    </bindings>
    <client>
<!-- highlight-next-line -->
      <endpoint address="https://localhost:44353/Sts/Issuer.svc/mixed/username"
                binding="ws2007HttpBinding"
                bindingConfiguration="mixed"
                contract="System.ServiceModel.Security.IWSTrustChannelContract"
                name="sts mixed"/>
<!-- highlight-start -->
      <endpoint name="ISalesOrderService"
                address="https://localhost:44353/Sales/SalesOrderService.svc"
                binding="ws2007FederationHttpBinding"
                contract="MyProject.Services.Common.ISalesOrderService"
                bindingConfiguration="mixed"/>
<!-- highlight-end -->
    </client>
  </system.serviceModel>
</configuration>
```

Next, you can create a static class `WcfServices` that stores the access token for your WCF services in the `IssuedToken` property, and uses it in the WCF client proxies that are registered with the DI container from the above client configuration via the `AddWcfClientServices` extension method provided by Xomega Framework, as follows.

```cs
public static class WcfServices
{
/* highlight-next-line */
    private static SecurityToken IssuedToken { get; set; }

    public static IServiceCollection AddWcfServices(this IServiceCollection services)
    {
/* highlight-next-line */
        services.AddWcfClientServices(() => IssuedToken, null, null);
        return services;
    }
}
```

This would allow you to register the WCF client proxies during startup in your `ConfigureServices` method, as follows.

```cs
public static void ConfigureServices(HostBuilderContext context, IServiceCollection services)
{
    ...
/* highlight-next-line */
    services.AddWcfServices();
    ...
}
```

### Authentication with WCF API

Now your client app just needs to obtain and set the `IssuedToken` in the `WcfServices` class, to call the WCF services. To do that, you can add an `Authenticate` utility method that takes a username and password, and calls the STS endpoint to get an access token for the current client's audience URI, as follows.

```cs
public static class WcfServices
{
    ...
/* highlight-next-line */
    public const string AudienceUri = "http://Client.Wpf";

/* highlight-next-line */
    public static ClaimsPrincipal Authenticate(string user, string password)
    {
        try
        {
            var factory = new WSTrustChannelFactory("sts message");
            factory.Credentials.UserName.UserName = user;
            factory.Credentials.UserName.Password = password;
            var channel = factory.CreateChannel();
/* highlight-start */
            IssuedToken = channel.Issue(new RequestSecurityToken(RequestTypes.Issue, KeyTypes.Bearer)
            {
                AppliesTo = new EndpointReference(AudienceUri)
            });
/* highlight-end */

            var identities = GetIdentitiesFromSamlToken(IssuedToken, AudienceUri, true);
            return new ClaimsPrincipal(identities);
        }
        catch (MessageSecurityException)
        {
            ErrorList currentErrors = new ErrorList(App.Services.GetService<ResourceManager>());
            currentErrors.AddError(ErrorType.Security, Messages.InvalidCredentials);
            currentErrors.Abort(currentErrors.ErrorsText);
        }
        return null;
    }
}
```

:::note
For your WCF service to accept the audience URI of your client app, you should add it to the identity model configuration of the WCF project, as follows.

```xml
<system.identityModel>
  <identityConfiguration saveBootstrapContext="true">
    <audienceUris>
<!-- highlight-next-line -->
      <add value="http://Client.Wpf"/>
    </audienceUris>
    ...
  </identityConfiguration>
</system.identityModel>
```
:::

The `Authenticate` method above uses another utility method `GetIdentitiesFromSamlToken` to construct claims identities from the obtained access token. You can do it by constructing a `SamlSecurityTokenHandler` and using it to validate the provided token, as follows.

```cs
public static IEnumerable<ClaimsIdentity> GetIdentitiesFromSamlToken(SecurityToken token, string audienceUri, bool trustIssuer)
{
    SamlSecurityTokenHandler handler = new SamlSecurityTokenHandler
    {
        Configuration = new SecurityTokenHandlerConfiguration()
    };
    SamlSecurityToken samlToken = token as SamlSecurityToken;

    if (samlToken == null && token is GenericXmlSecurityToken)
        samlToken = handler.ReadToken(new XmlNodeReader(((GenericXmlSecurityToken)token).TokenXml)) as SamlSecurityToken;

    if (samlToken == null) throw new ArgumentException("The token must be a SAML token or a generic XML SAML token");

    handler.SamlSecurityTokenRequirement.CertificateValidator = X509CertificateValidator.None;
    handler.Configuration.AudienceRestriction.AllowedAudienceUris.Add(new Uri(audienceUri));
    if (trustIssuer)
    {
        // configure to auto-trust the issuer
        ConfigurationBasedIssuerNameRegistry issuers = handler.Configuration.IssuerNameRegistry as ConfigurationBasedIssuerNameRegistry;
        issuers.AddTrustedIssuer(((X509SecurityToken)samlToken.Assertion.SigningToken).Certificate.Thumbprint, "sts");
    }
    else handler.Configuration.IssuerNameRegistry.LoadCustomConfiguration(
        SystemIdentityModelSection.DefaultIdentityConfigurationElement.IssuerNameRegistry.ChildNodes);
    return handler.ValidateToken(samlToken);
}
```

Now, if you use a DI-enabled WPF client, you can register a `DefaultPrincipalProvider` during the startup, as follows.

```cs
public static void ConfigureServices(HostBuilderContext context, IServiceCollection services)
{
    ...
/* highlight-next-line */
    services.AddSingleton<IPrincipalProvider, DefaultPrincipalProvider>();
    ...
}
```

As the first screen, you would show your *Login* view, where you can collect the user name and password from the user,  and then call the `Authenticate` helper method, and set the result to the `CurrentPrincipal` of the injected `principalProvider`, when the user clicks the *Login* button, as follows.

```cs title="LoginView.cs"
principalProvider.CurrentPrincipal = WcfServices.Authenticate(user, password);
```

This will allow you to check the user's claims on the client side, in order to enable or disable certain functions or UI elements as appropriate.

:::caution
When the `IssuedToken` expires, any calls to the WCF services will stop working. You may need to provide any code to handle it gracefully, and either pop up the *Login* dialog again or make the user restart the app.
:::
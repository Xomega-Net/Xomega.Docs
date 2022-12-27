---
sidebar_position: 3
---

# 4.2 Password authentication

In this section, we are going to add a common *Login View* for our application, as well as a service that performs user authentication by email and password.

:::note
The final implementation of the authentication will depend on the specific technology we use, and we'll describe it for each technology in the subsequent sections.
:::

## Defining Authentication data object

As usual, we will begin by defining the relevant things in our Xomega model. Let's open up the `person.xom` file, and declare a new data object called `AuthenticationObject`, which will serve as a data model for our *Login* view.

```xml title="person.xom"
<!-- added-lines-start -->
  <objects>[...]
  <xfk:data-objects>
    <xfk:data-object class="AuthenticationObject"/>
  </xfk:data-objects>
<!-- added-lines-end -->
```

### Credentials structure

Next, we will define new structure `credentials` with two parameters for the `email` and `password`, which will be added to our `AuthenticationObject` as properties.

```xml
<!-- added-lines-start -->
<struct name="credentials">
  <param name="email" type="email" required="true"/>
  <param name="password" type="plain password" required="true"/>
  <config>
<!-- highlight-next-line -->
    <xfk:add-to-object class="AuthenticationObject"/>
  </config>
</struct>
<!-- added-lines-end -->
```

:::note
Notice how we use the `email` type that we defined earlier, and a `plain password` type for the password parameter, which is pre-configured in the Xomega model to use a password field.
:::

### Customizing Authentication object

Since `AuthenticationObject` doesn't represent any persisted object, we will want to turn off modification tracking for it in a custom subclass, so we'll add a `customize="true"` attribute.

Also, to configure the fields for the *Login* view, we will make them stack up in one column by setting `field-cols="1"`, and will set up `access-key` values, which allow you to easily navigate to those fields using keyboard shortcuts.

The following snippet illustrates this setup.

```xml
<xfk:data-objects>
<!-- highlight-next-line -->
  <xfk:data-object class="AuthenticationObject" customize="true">
<!-- added-lines-start -->
    <ui:display>
      <ui:fields field-cols="1">
        <ui:field param="email" access-key="m"/>
        <ui:field param="password" access-key="P"/>
      </ui:fields>
    </ui:display>
  </xfk:data-object>
<!-- added-lines-end -->
</xfk:data-objects>
```

## Adding Authenticate operation

Next let's add an operation `authenticate` to the `person` object, which will use the `credentials` structure as an input argument. We also don't want to expose it via REST API, since the latter will use its own standard authentication mechanism, so we'll configure our operation to not support REST, as shown below.

```xml title="person.xom"
<object name="person">
  <operations>
<!-- added-lines-start -->
    <operation name="authenticate" type="update">
      <input arg="credentials" struct="credentials"/>
      <config>
<!-- highlight-next-line -->
        <rest:method not-supported="true"/>
      </config>
      <doc>
        <summary>Authenticates a Person using email and password.</summary>
      </doc>
    </operation>
<!-- added-lines-end -->
    ...
  </operations>
</object>
```

:::note
Even though the operation is not going to update anything in the database, we marked it with `type="update"`, so that the *Login View* would be generated with a *Save* button plus the logic to call this operation with the supplied credentials, which is pretty much what we want for the *Login* button.
:::

## Defining Login view

So let's go ahead, and add the actual `LoginView` definition in the model as follows.

```xml title="person.xom"
<xfk:data-objects>[...]
<!-- added-lines-start -->
<ui:views>
  <ui:view name="LoginView" title="Login" customize="true" child="true">
<!-- highlight-next-line -->
    <ui:view-model data-object="AuthenticationObject"/>
  </ui:view>
</ui:views>
<!-- added-lines-end -->
```

Let's have a look at some things that we have configured on our *Login View*. We will need to customize the logic for the generated view, so we marked it with the `customize="true"` attribute. We also set the `child="true"` attribute, so that this view would not be added to the main menu by the generator. And, of course, we set our `AuthenticationObject` as the view model for the view.

These are all the changes that we need in the model, so we can go ahead and build the *Model* project now.

## Custom service code for Authenticate 

Before we provide a custom implementation for the `authenticate` operation, let's open the `Resources.resx` file under the `AdventureWorks.Services.Entities` project, add the following message for invalid credentials, and run the custom tool on the nested `Messages.tt` file to regenerate message constants.

|Name|Value|Comment|
| -- | --- | ----- |
|InvalidCredentials|Invalid credentials.||

Next, let's open the `PersonServiceCustomized.cs` under the generated `PersonService.cs`, and provide a custom implementation for the `AuthenticateAsync` method as shown below.

```cs title="PersonServiceCustomized.cs"
public class PersonServiceCustomized : PersonService
{
    ...
/* added-lines-start */
    public override async Task<Output> AuthenticateAsync(
        Credentials _credentials, CancellationToken token = default)
    {
        // lookup password
        var pwdQry = from em in ctx.EmailAddress
                      join pw in ctx.Password on em.BusinessEntityId equals pw.BusinessEntityId
                      where em.EmailAddress1 == _credentials.Email
                      select pw;
        var pwd = await pwdQry.FirstOrDefaultAsync(token);

        // validate credentials
        bool valid = false;
        if (pwd != null && _credentials.Password != null)
        {
            valid = _credentials.Password.Equals("password"); // for testing only
            // TODO: hash _credentials.Password using pwd.PasswordSalt,
            //       and compare it with pwd.PasswordHash instead
        }
// highlight-next-line
        if (!valid) currentErrors.CriticalError(ErrorType.Security, Messages.InvalidCredentials);
        return new Output(currentErrors);
    }
/* added-lines-end */
    ...
}
```

This is where we would need to hash the user-supplied password using the salt that is stored in the database along with the hashed password, and compare the result with the latter. For ease of testing though, we will instead just compare it with a hardcoded word "password" for now.

If the email address is not found or if the password is not valid, we'll report a critical error using the generated constant `InvalidCredentials` for our message.

## Custom code for the Authentication object

Next, let's open the generated `AuthenticationObjectCustomized.cs` in the `AdventureWorks.Client.Common` project, and set it up to not track modifications, as shown below. We also set the `IsNew` flag to `false`, so that the view title would say just *Login* instead of *New Login*.

```cs title="AuthenticationObjectCustomized.cs"
public class AuthenticationObjectCustomized : AuthenticationObject
{
    ...
    protected override void OnInitialized()
    {
        base.OnInitialized();
/* added-lines-start */
        TrackModifications = false;
        IsNew = false;
/* added-lines-end */
    }
}
```

With this common code, we'll have an internal operation that can authenticate a person by email and password, and a generated *Login View* that can collect this information and call that operation when the user clicks the *Save* button.

Presenting the *Login* view and the actual authentication of the user will need to be implemented for each specific technology, as we'll see in subsequent sections.

Before that though, let's see how you can write common platform-independent security logic in the business services and the presentation layer.
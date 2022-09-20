---
sidebar_position: 2
---

# 4.1 Create claims identity

Let's update our model and add some code that would allow us to construct a claims identity for a user.

## Email type for authentication

We will start by declaring a type for email in the `email_address.xom` file, which we're planning to use as the user ID. We will also use this type on the `email address` field of the `email address` object, instead of a more generic type `name`, as follows.

```xml title="email_address.xom"
<!-- added-lines-start -->
<types>
  <type name="email" base="name"/>
</types>
<!-- added-lines-end -->
...
  <object name="email address">
    <fields>
      ...
<!-- removed-next-line -->
      <field name="email address" type="name">[...]
<!-- added-next-line -->
      <field name="email address" type="email">[...]
      ...
    </fields>
  </object>
```

## Person Type for authorization

Next, we will create an enumeration `person type` with possible values of the person type and their descriptions, and will declare a type with the same name for that enumeration, and use that type on the `person type` field of the `person` object, as follows.

```xml title="person.xom"
<types>
  <type name="person" base="business entity"/>
<!-- added-lines-start -->
  <type name="person type" base="enumeration" size="2">
    <enum ref="person type"/>
  </type>
<!-- added-lines-end -->
</types>
<!-- added-lines-start -->
<enums>
  <enum name="person type">
    <item name="Store contact" value="SC"/>
    <item name="Individual customer" value="IN"/>
    <item name="Sales person" value="SP"/>
    <item name="Employee" value="EM"/>
    <item name="Vendor contact" value="VC"/>
    <item name="General contact" value="GC"/>
  </enum>
</enums>
<!-- added-lines-end -->
<objects>
  <object name="person">
    <fields>
      ...
<!-- removed-next-line -->
      <field name="person type" type="code2" required="true">
<!-- added-next-line -->
      <field name="person type" type="person type" required="true">
        <config>[...]
        <doc>
          <summary>Primary type of person: SC = Store Contact, IN = Individual (retail) customer,
            SP = Sales person, EM = Employee (non-sales), VC = Vendor contact, GC = General contact</summary>
        </doc>
      </field>
      ...
    </fields>
  </object>
</objects>
```

## Person Info structure for claims

With that done, let's declare a structure `person info` that will contain all the necessary information for the security claims, as follows.

```xml title="person.xom"
<!-- added-lines-start -->
<structs>
  <struct name="person info" object="person">
    <param name="business entity id"/>
    <param name="person type"/>
    <param name="first name"/>
    <param name="last name"/>
    <param name="email" type="email" required="true"/>
    <param name="store" type="store"/>
    <param name="vendor" type="vendor"/>
  </struct>
</structs>
<!-- added-lines-end -->
```

### Read operation for Person Info

Finally, let's add an operation `read` to the `person` object, which will accept an email address as the input key, and output the `person info` structure that we created. This operation will be used by the authentication logic to create a claims identity, and should not be exposed via REST API, so we need to set `not-supported="true"` on its `rest:method` element, as shown below.

```xml title="person.xom"
<object name="person">
  <fields>[...]
<!-- added-lines-start -->
  <operations>
    <operation name="read" type="read">
      <input>
<!-- highlight-next-line -->
        <param name="email" type="email" required="true"/>
      </input>
<!-- highlight-next-line -->
      <output struct="person info"/>
      <config>
<!-- highlight-next-line -->
        <rest:method not-supported="true"/>
      </config>
      <doc>
        <summary>Reads person info by email as the key.</summary>
      </doc>
    </operation>
  </operations>
<!-- added-lines-end -->
</object>
```

Given that the structure for this operation is very custom, Xomega will not be able to generate a meaningful default implementation for this method. Instead of trying to inline any custom code into the generated service file like we did before, we will want to just subclass that generated service, and override the entire method in there.

To enable that, we will find the `svc:customize` element in the `config` section of the `person` object, and will set the `subclass="true"` attribute, as follows.

```xml
<object name="person">
  ...
  <config>
    <sql:table name="Person.Person"/>
    <edm:customize extend="true"/>
<!-- removed-next-line -->
    <svc:customize preserve-on-clean="true"/>
<!-- added-next-line -->
    <svc:customize preserve-on-clean="true" subclass="true"/>
  </config>
</object>
```

### Implementing custom service

Before we provide a custom implementation for the `read` operation, let's open the `Resources.resx` file under the `AdventureWorks.Services.Entities` project, and add a message for when the person is not found for a given email, as follows.

|Name|Value|Comment|
| -- | --- | ----- |
|PersonNotFound|Person info not found.||

As usual, after that you want to run the custom tool on the nested `Messages.tt` file to regenerate message constants.

Now let's build the model, and navigate to the generated `PersonService` class. Nested inside that class will be a file for the custom service implementation `PersonServiceCustomized`. Let's go ahead and implement the `ReadAsync` operation there as follows.

```cs title="PersonServiceCustomized.cs"
/* added-lines-start */
using AdventureWorks.Services.Common;
using Microsoft.EntityFrameworkCore;
/* added-lines-end */
...
public class PersonServiceCustomized : PersonService
{
    ...
/* added-lines-start */
    public override async Task<Output<PersonInfo>> ReadAsync(string _email, CancellationToken token = default)
    {
        // lookup and return person info
        var qry = from em in ctx.EmailAddress
                  join ps in ctx.Person on em.BusinessEntityId equals ps.BusinessEntityId
                  join bc in ctx.BusinessEntityContact on ps.BusinessEntityId equals bc.PersonId into bec
                  from bc in bec.DefaultIfEmpty()
                  join st in ctx.Store on bc.BusinessEntityId equals st.BusinessEntityId into store
                  from st in store.DefaultIfEmpty()
                  join vn in ctx.Vendor on bc.BusinessEntityId equals vn.BusinessEntityId into vendor
                  from vn in vendor.DefaultIfEmpty()
// highlight-next-line
                  where em.EmailAddress1 == _email
                  select new PersonInfo
                  {
                      BusinessEntityId = ps.BusinessEntityId,
                      PersonType = ps.PersonType,
                      FirstName = ps.FirstName,
                      LastName = ps.LastName,
                      Email = em.EmailAddress1,
                      Store = st.BusinessEntityId,
                      Vendor = vn.BusinessEntityId
                  };
        var person = await qry.FirstOrDefaultAsync(token);
// highlight-next-line
        if (person == null) currentErrors.CriticalError(ErrorType.Data, Messages.PersonNotFound);

        return new Output<PersonInfo>(currentErrors, person);
    }
/* added-lines-end */
}
```

As you see, we are using several joins and some rather cumbersome left joins in LINQ to retrieve the data. If we cannot find the person by the provided email address, then we add a critical error using a generated constant for our message.

:::note
Unlike the way we customized service code before, where we extended the partial service class, and provided custom code inline with the generated code, this is a subclass of the generated service, where you can override any operation, and need to provide custom implementation for the entire method.
:::

## Constructing Claims Identity

In order to encapsulate common security related code that can be shared between different types of projects, we will add a new static class called `SecurityManager` to the `AdventureWorks.Services.Common` project, where we will define a method that creates claims identity from a `PersonInfo` structure as follows.

```cs title="SecurityManager.cs"
/* added-next-line */
using System.Security.Claims;
...
/* added-lines-start */
public static class SecurityManager
{
// highlight-start
    public const string ClaimTypeStore = "http://adventure-works.com/store";
    public const string ClaimTypeVendor = "http://adventure-works.com/vendor";
// highlight-end

    public static ClaimsIdentity CreateIdentity(string authenticationType, PersonInfo userInfo)
    {
        if (userInfo == null) return null; // not authenticated

        ClaimsIdentity ci = new ClaimsIdentity(authenticationType);
        ci.AddClaim(new Claim(ClaimTypes.NameIdentifier, "" + userInfo.BusinessEntityId,
                              ClaimValueTypes.Integer));
        ci.AddClaim(new Claim(ClaimTypes.Name, userInfo.FirstName + " " + userInfo.LastName));
        ci.AddClaim(new Claim(ClaimTypes.GivenName, userInfo.FirstName));
        ci.AddClaim(new Claim(ClaimTypes.Surname, userInfo.LastName));
        ci.AddClaim(new Claim(ClaimTypes.Email, userInfo.Email));
        ci.AddClaim(new Claim(ClaimTypes.Role, userInfo.PersonType)); // person type is user's role
// highlight-start
        if (userInfo.Store != null)
            ci.AddClaim(new Claim(ClaimTypeStore, "" + userInfo.Store.Value, ClaimValueTypes.Integer));
        if (userInfo.Vendor != null)
            ci.AddClaim(new Claim(ClaimTypeVendor, "" + userInfo.Vendor.Value, ClaimValueTypes.Integer));
// highlight-end
        return ci;
    }
}
/* added-lines-end */
```

For most of the fields in the `PersonInfo` structure we used standard claim types. For the `person type` we used the `Role` claim type, which is consistent with how we're using it in the first place.

For any non-standard info, such as the store ID or the vendor ID for the user, we're using custom claim types, which we declared as constants at the top of the class.

## Security utilities

To simplify any security checks in the code, we can also define some handy extension methods on the `IPrincipal` interface.

### Role checking utilities

For example, the following methods will allow us to easily check some user roles, while also leveraging constants that were generated from the `person type` enumeration that we defined in the model.

```cs
/* added-next-line */
using AdventureWorks.Services.Common.Enumerations;
using System.Security.Principal;
...
public static class SecurityManager
{
    ...
/* added-lines-start */
    public static bool IsStoreContact(this IPrincipal principal)
    {
        return principal.IsInRole(PersonType.StoreContact);
    }

    public static bool IsIndividualCustomer(this IPrincipal principal)
    {
        return principal.IsInRole(PersonType.IndividualCustomer);
    }

    public static bool IsSalesPerson(this IPrincipal principal)
    {
        return principal.IsInRole(PersonType.SalesPerson);
    }

    public static bool IsEmployee(this IPrincipal principal)
    {
        return principal.IsSalesPerson() || principal.IsInRole(PersonType.Employee);
    }
/* added-lines-end */
}
```

### Custom claims utilities

Here's another example, where we can easily retrieve typed values of the custom claims, such as the store ID associated with the user.

```cs
/* added-next-line */
using System.Linq;
...
public static class SecurityManager
{
    ...
/* added-lines-start */
    public static int? GetStoreId(this IPrincipal principal)
    {
        Claim storeIdClaim = null;
        if (principal.Identity is ClaimsIdentity ci &&
            (storeIdClaim = ci.Claims.FirstOrDefault(c => c.Type == ClaimTypeStore)) != null)
            return int.Parse(storeIdClaim.Value);
        return null;
    }

    public static int? GetPersonId(this IPrincipal principal)
    {
        Claim idClaim = null;
        if (principal.Identity is ClaimsIdentity ci &&
            (idClaim = ci.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)) != null)
            return int.Parse(idClaim.Value);
        return null;
    }
/* added-lines-end */
}
```

Now that we have done all the prep work for creating a claims identity, we can move on to implementing user authentication.

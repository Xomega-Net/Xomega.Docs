---
sidebar_position: 4
---

# Updating Data

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

As with querying data, you have a variety of options for implementing business logic and updating data in your business services - from calling straight SQL commands or stored procedures to using EF Core's DB context and entities.

Xomega Framework provides you with some additional support for validations and auto-mapping between entities and DTOs, as described below.

## Input data validation

When you pass an input structure to your business services, that structure is often referred to as the model, especially when the services are exposed via a remote API, such as REST. The standard way to specify model validation requirements in .NET is to decorate the model properties with validation attributes from the `System.ComponentModel.DataAnnotations` namespace that inherit from the base class `ValidationAttribute`.

The communication infrastructure in .NET, such as ASP.NET or WCF, can use those attributes to automatically validate your models before your service is invoked, thereby saving you from manually validating individual properties of your input model.

Xomega Framework enhances both the validation attributes and the validation process, in order to leverage its [error reporting](errors) framework.

### Validation attributes

The standard validation attributes provided in .NET, such as `Required` and `MaxLength`, have some limitations when used with Xomega Framework, which the latter addresses by providing custom attributes `XRequired` and `XMaxLength`.

#### Error message resources

For the standard validation attributes you can specify either a direct error message or the message resource name and a resource type. The resource type needs to point to a class similar to the `.Designer.cs` class generated from a specific resource set, which means that you cannot use the [hierarchical resources](errors#resources) that are set up in the current DI container.

Attributes `XRequired` and `XMaxLength` use the hierarchical resources for default error message codes `Validation_Required` and `Validation_MaxLength` (or `Validation_MaxLengths` for multiple values) that are defined in the `Xomega.Framework.Messages` class. This means that you can easily override the texts for those error codes in your specific projects, if you need to customize them.

#### Validation of collections

If your property has a collection of values, which will be saved as rows in a database table, then you may need to make sure that each individual value in the collection is valid, e.g. doesn't exceed the maximum length for that DB column. The standard validation attributes don't validate individual values in a collection, requiring you to create a custom validation attribute.

The `XMaxLength` attribute can be applied to a collection of strings, and will check the length of each value. The error message will include the specific values that exceed the maximum length to help the user identify them in a long list.

The following snippet illustrates the usage of these validation attributes provided by Xomega Framework.

```cs
public class SalesOrder_UpdateInput_Data
{
/* highlight-start */
    [XRequired]
    [XMaxLength(25)]
/* highlight-end */
    public string SalesOrderNumber { get; set; }

/* highlight-start */
    [XMaxLength(10)]
/* highlight-end */
    public ICollection<string> SalesReasons { get; set; }
}
```

#### Validation against a lookup table

If you need to validate your model property against a certain list of values defined in a [Xomega Framework lookup table](../common-ui/lookup), then you should use an `XLookupValue` attribute that you construct with the name of your lookup table, as follows.

```cs
[XRequired]
/* highlight-next-line */
[XLookupValue(SalesOrderStatus.EnumName)]
public byte Status { get; set; }
```

In addition to the lookup table name, you can also specify the following optional parameters for this attribute.
- `CacheType` - the type of cache to use to get the specified lookup table. The default is `LookupCache.Global`.
- `ValidationType` - the type of validation to perform as follows.
  - `LookupValidationType.ActiveItem` - the value should be an active item of the enum.
  - `LookupValidationType.AnyItem` - the value should be any item of the enum (default).
  - `LookupValidationType.None` - the value is not validated against the lookup table.

:::note
The `XLookupValue` attribute can work both on scalar values and on collections to validate each value in the collection.
:::

### Manual model validation

If you expose your services via REST API or WCF, then the input model validation can be done automatically by the ASP.NET or WCF before your business service method is called. If, however, you call your business service directly from your presentation logic, e.g. from Blazor Server, WebForms or 2-tier WPF apps, then your presentation logic should provide client-side validations before calling the services, which would reduce the need to repeat those validations in the business service.

Nevertheless, you can still do the model validation manually in each service as needed by calling `GetValidationErrors` method on the `DataAnnotationValidator` class, and adding the validation results to the `currentErrors` list, as follows.

```cs
public virtual async Task<Output<SalesOrder_UpdateOutput>> UpdateAsync(int _salesOrderId,
    SalesOrder_UpdateInput_Data _data, CancellationToken token = default)
{
    ...
/* highlight-start */
    foreach (var valRes in DataAnnotationValidator.GetValidationErrors(serviceProvider, _data))
    {
        currentErrors.AddValidationError(valRes.ErrorMessage);
    }
/* highlight-end */
    currentErrors.AbortIfHasErrors();
    ...
}
```

If you don't want to proceed with further validations when the model data is invalid, then you should call `currentErrors.AbortIfHasErrors()` right after that, and catch any exceptions, as per the Xomega Framework [error reporting](errors#reporting).

## Updating with Entity Framework

A common way to implement the update logic in your business service is to use an ORM, such as EF Core. Xomega Framework doesn't have a package with a direct dependency on EF Core or EF 6.x, but you can easily add some helper extension methods to integrate EF with Xomega Framework, as you will see below.

The following code snippet illustrates the typical steps involved in the update operations using the `UpdateAsync` method for sales orders.

```cs
public virtual async Task<Output<SalesOrder_UpdateOutput>> UpdateAsync(
    int _salesOrderId, SalesOrder_UpdateInput_Data _data, CancellationToken token = default)
{
    SalesOrder_UpdateOutput res = new SalesOrder_UpdateOutput();
    try
    {
        // 1. abort if model validation errors exist
        currentErrors.AbortIfHasErrors();

        // 2. look up entity using an extension method, abort if not found
        SalesOrder obj = await ctx.FindEntityAsync<SalesOrder>(currentErrors, token, _salesOrderId);

        // 3. set values from the model
        var entry = ctx.Entry(obj);
        entry.CurrentValues.SetValues(_data);

        // 4. run any validations using extension methods, perform business logic
        await ctx.ValidateKeyAsync<Customer>(currentErrors, token, "CustomerId", _data.CustomerId);
        ...

        // 5. abort before save if any errors were generated during the validation and business logic
        currentErrors.AbortIfHasErrors();
        await ctx.SaveChangesAsync(token); // 6. save all changes in the DB context

        // 7. populate the result structure using auto-mapper
        ServiceUtil.CopyProperties(obj, res);
    }
    catch (Exception ex)
    {
        // 8. convert any exceptions to errors, and add them to current errors
        currentErrors.MergeWith(errorParser.FromException(ex));
    }
    // 9. return the current errors along with the result, where applicable
    return new Output<SalesOrder_UpdateOutput>(currentErrors, res);
}
```

The above code uses some extension methods, which will help you make your logic very succinct. You'll see sample implementations of those methods in the following sections.

:::tip
If you create your solution using a Xomega.Net for Visual Studio template, then it will automatically include implementation of those extension methods for both EF Core and EF 6.x.
:::

### Look up entity by key

When looking up an entity by its key(s), you typically want to check if it is not null, and throw an appropriate critical error otherwise. This would allow you to safely use that entity further in your code without having to check for nulls. You can implement this behavior in a static extension method for the DB context, as follows.

<Tabs groupId="ef">
  <TabItem value="ef-core" label="Entity Framework Core" default>

```cs
public static async Task<T> FindEntityAsync<T>(this DbContext ctx,
    ErrorList errors, CancellationToken token, params object[] keys) where T : class
{
    T entity = await ctx.Set<T>().FindAsync(keys, token);
    if (entity == null)
    {
        string error = keys.Length > 1 ? Messages.EntityNotFoundByKeys : Messages.EntityNotFoundByKey;
/* highlight-next-line */
        errors.CriticalError(ErrorType.Data, error, typeof(T).Name, string.Join<object>(", ", keys));
    }
    return entity;
}
```
  </TabItem>
  <TabItem value="ef-6" label="Entity Framework 6.x" default>

```cs
public static async Task<T> FindEntityAsync<T>(this DbContext ctx,
    ErrorList errors, CancellationToken token, params object[] keys) where T : class
{
    T entity = await ctx.Set<T>().FindAsync(token, keys);
    if (entity == null)
    {
        string error = keys.Length > 1 ? Messages.EntityNotFoundByKeys : Messages.EntityNotFoundByKey;
/* highlight-next-line */
        errors.CriticalError(ErrorType.Data, error, typeof(T).Name, string.Join<object>(", ", keys));
    }
    return entity;
}
```
  </TabItem>
</Tabs>

Once you add such an extension method, you can safely look up your entity in just one line, as shown below.

```cs
SalesOrder obj = await ctx.FindEntityAsync<SalesOrder>(currentErrors, token, _salesOrderId);
```

:::note
Note that using the `ErrorType.Data` error type will automatically ensure that your REST API would return a 401 (NotFound) HTTP status code, as per the REST best practices.
:::

### Validate an entity key

If your input data includes reference keys to other entities, such as a `CustomerId` on the sales order data, then you may want to validate that the referenced entity exists before saving it, even if you don't need to look up the entire referenced entity for anything else.

:::note
If your database table has a foreign key relationship to another table, then you would get a DB error during the save, if you provide an invalid key. However, this error would not be user-friendly and may expose your DB structure, so the best practice is to manually validate the key in the code.
:::

To help you easily validate reference keys in the code, you can add the following extension method for the DB context.

<Tabs groupId="ef">
  <TabItem value="ef-core" label="Entity Framework Core" default>

```cs
public static async Task ValidateKeyAsync<T>(this DbContext ctx,
    ErrorList errors, CancellationToken token, string param, params object[] keys) where T : class
{
    if (keys == null || keys.Length == 0 || keys.All(k => k == null)) return;
    T entity = await ctx.Set<T>().FindAsync(keys, token);
    if (entity == null)
    {
        string error = keys.Length > 1 ? Messages.InvalidForeignKeys : Messages.InvalidForeignKey;
/* highlight-next-line */
        errors.AddValidationError(error, string.Join<object>(", ", keys), param, typeof(T).Name);
    }
}
```
  </TabItem>
  <TabItem value="ef-6" label="Entity Framework 6.x" default>

```cs
public static async Task ValidateKeyAsync<T>(this DbContext ctx,
    ErrorList errors, CancellationToken token, string param, params object[] keys) where T : class
{
    if (keys == null || keys.Length == 0 || keys.All(k => k == null)) return;
    T entity = await ctx.Set<T>().FindAsync(token, keys);
    if (entity == null)
    {
        string error = keys.Length > 1 ? Messages.InvalidForeignKeys : Messages.InvalidForeignKey;
/* highlight-next-line */
        errors.AddValidationError(error, string.Join<object>(", ", keys), param, typeof(T).Name);
    }
}
```
  </TabItem>
</Tabs>

Since the method doesn't return the actual entity, and there is no danger of your calling code to throw an error if it doesn't exist, it is possible to add a regular validation error here, rather than a critical error. This allows you to catch multiple such validation errors and report them to the user all at once.

With this extension method, you'll be able to validate any foreign keys in your code, as follows.

```cs
await ctx.ValidateKeyAsync<Customer>(currentErrors, token, "CustomerId", _data.CustomerId);
```

:::note
The `"CustomerId"` parameter that you pass to the method is used to indicate the foreign key field in the generic error message.
:::

### Validate unique key

When creating new entities with user-supplied keys that are not auto-generated by the DB, you need to ensure that an entity with this key does not yet exist. Otherwise you'll get a primary key violation error from the database, which would not be user-friendly and may expose your DB structure.

To help manually validate uniqueness of a simple or composite key, and to throw a custom user-friendly message, you can add the following extension method for the DB context.

<Tabs groupId="ef">
  <TabItem value="ef-core" label="Entity Framework Core" default>

```cs
public static async Task ValidateUniqueKeyAsync<T>(this DbContext ctx,
    ErrorList errors, CancellationToken token, params object[] keys) where T : class
{
    if (keys == null || keys.Length == 0 || keys.All(k => k == null)) return;
    T entity = await ctx.Set<T>().FindAsync(keys, token);
    if (entity != null)
    {
        string error = keys.Length > 1 ? Messages.EntityExistsWithKeys : Messages.EntityExistsWithKey;
/* highlight-next-line */
        errors.CriticalError(ErrorType.Concurrency, error, typeof(T).Name, string.Join<object>(", ", keys));
    }
}
```
  </TabItem>
  <TabItem value="ef-6" label="Entity Framework 6.x" default>

```cs
public static async Task ValidateUniqueKeyAsync<T>(this DbContext ctx,
    ErrorList errors, CancellationToken token, params object[] keys) where T : class
{
    if (keys == null || keys.Length == 0 || keys.All(k => k == null)) return;
    T entity = await ctx.Set<T>().FindAsync(token, keys);
    if (entity != null)
    {
        string error = keys.Length > 1 ? Messages.EntityExistsWithKeys : Messages.EntityExistsWithKey;
/* highlight-next-line */
        errors.CriticalError(ErrorType.Concurrency, error, typeof(T).Name, string.Join<object>(", ", keys));
    }
}
```
  </TabItem>
</Tabs>

This validation would throw a critical error with a type `ErrorType.Concurrency`, which would result in the 409 (Conflict) HTTP status code for the REST API.

In the following example, when adding a new sales reason to a sales order, we use this extension method to validate that the provided reason does not yet exist for that sales order.

```cs
public async Task<Output> Reason_CreateAsync(int _salesOrderId, int _salesReasonId,
    SalesOrderReason_CreateInput_Data _data, CancellationToken token = default)
{
    ...
/* highlight-next-line */
    await ctx.ValidateUniqueKeyAsync<SalesOrderReason>(currentErrors, token, _salesOrderId, _salesReasonId);
    ...
}
```

### Auto-map properties

You can use any choice of the auto-mapping frameworks in order to copy data from the DTOs to the entity properties and vice versa. We already showed you how you can call `ctx.Entry(obj).CurrentValues.SetValues(_data)` to set the entity properties with the values from the specified DTO.

Conversely, in order to set the values on the result structure from the properties of an entity, Xomega Framework provides a simple utility method `ServiceUtil.CopyProperties`, which copies properties with the same name and type from the source object to the target object.

:::tip
You can also use this method for any `Read` operations that return some data from a specific entity.
:::

If needed, you can also provide an explicit list of properties to copy, by filtering all source properties, as follows.

```cs
ServiceUtil.CopyProperties(obj, res, obj.GetType().GetProperties().Where(p => ...));
```

:::note
It is safe to pass nulls as either the source or the target object, which saves you from any extra null checks.
:::
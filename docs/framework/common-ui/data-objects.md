---
sidebar_position: 4
---

# Data Objects

Data objects in Xomega Framework consist of a collection of [data properties](properties/base), as well as other [child data objects](#child-objects). In addition to holding the actual data for a UI view, they provide an easy way to manage the editability and security of its data elements, track modification state, and validate and perform [service operations](#service-operations), all in a platform-independent manner regardless of the UI framework being used.

Typically, a data object represents a group of UI data controls on your screen that are placed in the same UI panel, but it may also have internal properties that are not bound to any UI controls. A details UI view is normally bound to the main data object, with the child panels, tabs or fieldsets bound to the corresponding child objects. The action buttons are often bound to [action properties](properties/action) and call the data object's methods.

## Initialization

Regular data objects extend from the abstract base class `DataObject`, initialize their data properties, actions and child objects, and implement various methods and service calls that they support.

### Construction and registration

Your data objects are instantiated by the DI container, so they should have a constructor that takes a service provider and passes it to the base class as follows.

```cs
public class SalesOrderObject : DataObject
{
/* highlight-next-line */
    public SalesOrderObject(IServiceProvider serviceProvider) : base(serviceProvider)
    {
    }
}
```

To register your data objects with the DI service collection, we recommend you create a static class `DataObjects` with an extension method `AddDataObjects` that adds transient data objects of each type, as follows.

```cs title="DataObjects.cs"
public static IServiceCollection AddDataObjects(this IServiceCollection services)
{
    ...
/* highlight-next-line */
    services.AddTransient<SalesOrderObject, SalesOrderObject>();
    return services;
}
```

This will allow you to register all data objects with a single line of code in your application's startup class, as follows.

```cs
services.AddDataObjects();
```

### Data properties initialization

Your data object should implement the abstract method `Initialize`, where you should construct, configure and add your declared data properties, as illustrated below.

```cs
public IntegerKeyProperty SalesOrderIdProperty { get; private set; }
public DateProperty OrderDateProperty { get; private set; }
public EnumByteProperty StatusProperty { get; private set; }

/* highlight-next-line */
protected override void Initialize()
{
    SalesOrderIdProperty = new IntegerKeyProperty(this, SalesOrderId)
    {
        Required = true,
        Editable = false,
        IsKey = true,
    };
    OrderDateProperty = new DateProperty(this, OrderDate)
    {
        Required = true,
        Editable = false,
    };
    StatusProperty = new EnumByteProperty(this, Status)
    {
        Required = true,
        EnumType = "sales order status",
    };
}
```

When you pass `this` to the constructor of the property, it will automatically add that property to the data object under the provided name. We also recommend declaring property names as constants on the data object, so that you could use them in data bindings, or access the property by its name using an indexer, as follows.

```cs
DataProperty statusProperty = salesOrderObject[SalesOrderObject.Status];
```

You can also call `HasProperty(name)` or list all object's data properties using its `Properties` enumerable.

:::warning
Make sure that you **add all data properties** in the `Initialize` method. Any [initialization](properties/base#property-initialization) of data properties that requires other data properties to be available will be performed after this method, in the data object's `OnInitialized` method.
:::

### Action properties initialization

You should initialize any declared action properties in the same `Initialize` method, as the regular data properties. For common actions, you can use the [constants for your resource files](../services/errors#messageCodes), rather than declaring them in the object. Here is an example of how `DataObject` initializes its `DeleteAction`.

```cs
public ActionProperty DeleteAction { get; private set; }

/* highlight-next-line */
protected override void Initialize()
{
    ...
/* highlight-next-line */
    DeleteAction = new ActionProperty(this, Messages.Action_Delete);
    Expression<Func<DataObject, bool>> deleteEnabled = (obj) => obj != null && !obj.IsNew;
    DeleteAction.SetComputedEnabled(deleteEnabled, this);
}
```

:::note
While action properties share a common base class with data properties (`BaseProperty`), they do not get added to the same list as the regular data properties, and are **not accessible by name via an indexer**, nor included in the `Properties` enumeration.
:::

### Child objects initialization{#child-objects}

Similar to data properties and actions, you should initialize your declared child data objects in the `Initialize` method. However, you should construct the child object using the object's `ServiceProvider`, and register them via the `AddChildObject` method using a constant as the child object's name, as follows.

```cs
public const string Customer = "Customer";
public const string Detail = "Detail";

protected override void Initialize()
{
    ...
    DataObject objCustomer = ServiceProvider.GetService<SalesOrderCustomerObject>();
    AddChildObject(Customer, objCustomer);
    DataObject objDetail = ServiceProvider.GetService<SalesOrderDetailList>();
    AddChildObject(Detail, objDetail);
}
```

:::warning
Just like with the data properties, make sure that you add all child objects in the `Initialize` method so that they'd be available to any data properties that require access to child objects during [their initialization](properties/base#property-initialization).
:::

You can always access a child object by its name using the `GetChildObject` method that returns it as a base `DataObject`. To access typed child objects you can declare them as properties, and either initialize them in the `Initialize` method or have them use the `GetChildObject` method, as follows.

```cs
public SalesOrderCustomerObject CustomerObject => (SalesOrderCustomerObject)GetChildObject(Customer);
public SalesOrderDetailList DetailList => (SalesOrderDetailList)GetChildObject(Detail);
```

:::tip
For a child object, you can access its parent data object using the `Parent` property. You can also access the list of child objects using the `Children` enumerable.
:::

### Data initialization

After the data object is constructed, you may want to initialize its data with some values. For example, you may want to open a search form with some pre-initialized criteria or create a new object with some pre-set data.

`DataObject` class provides the `SetValues` and `SetValuesAsync` methods that take a string-based `NameValueCollection` argument, which was traditionally used in query strings. Views use these methods to initialize their main objects from the input parameters, but you can also leverage them as needed.

:::tip
You can also export the current values of data object's data properties as a `NameValueCollection` by calling its method `ToNameValueCollection()`. This would allow you to easily create a query string that can pre-populate it with the current values.
:::

## State management

Data objects allow controlling and tracking the state of their data properties through the entire object hierarchy.

### Property changes

Data objects implement the standard `INotifyPropertyChanged` interface and notify about changes in some of its properties, such as `Editable`, `Modified` or `IsNew`.

Your concrete data object subclass can also call the `FireDataPropertyChange` to make all its data properties, actions and child objects [fire the specified property change event](properties/base#firing-change-events). This is helpful when there is a change in the state of the data object that affects its entire hierarchy, and allows you to refresh any UI controls bound to its properties.

For example, making the data object not editable would affect all its properties and child objects, and you want to make sure that the bound controls become read-only or disabled in this case.

### Editability

Data objects have an `Editable` flag, which allows you to make the entire object not editable, including its data properties and child objects, by setting it to `false`. However, the effective value of the object's `Editable` flag is also determined by the `Editable` value of its parent object, if there is one, as well as the object's `AccessLevel`, which should be greater than `AccessLevel.ReadOnly`.

You can also specify conditions for when a data object is editable using an expression that returns a `bool` by calling the `SetComputedEditable` method, similar to the [computed editable support for data properties](properties/base#computed-editability). The value of the `Editable` flag will be then automatically updated based on the result of that expression.

For example, the code to specify that the child object `shippingAddressObject` of your `SalesOrderObject` should be editable only when the order status is not `Shipped` could look as follows.

```cs
Expression<Func<EnumProperty, bool>> xNotShipped = status => status.Value?.Id != StatusEnum.Shipped;
/* highlight-next-line */
shippingAddressObject.SetComputedEditable(xNotShipped, statusProperty);
```

This allows disabling all shipping address properties at once, as opposed to managing that for each individual data property.

### Security

As we mentioned above, data objects have a field `AccessLevel`, which you can set to `ReadOnly` when the user doesn't have permission to edit the data in this data object, rather than when its editability is driven by the current data values.

:::note
You can also set the `AccessLevel` to `None` to indicate that the user does not have any access to the data object, but the UI panel bound to this object needs to be able to handle this and make itself inaccessible.
:::

Data objects also expose the `CurrentPrincipal` property that returns the current principal based on the configured [principal provider](../services/security#principal-providers) for your app. This allows you to check the current user's permissions and claims within the data object and set the access level on any of its data properties or child objects.

### Validation

Data objects have a method `Validate` that allows you to validate its data properties and child objects at any time, as well as to perform any additional custom validations for that object. The method takes a boolean argument `force` to indicate whether you want to force all validations afresh, regardless of whether or not the corresponding properties have been changed since the last validation.

During the validation of the data object's properties, each data property will add any validation errors to its internal list of validation errors, as described [here](properties/base#property-validation). If your object requires additional validations of multiple properties, e.g. cross-field validation, then you need to override the `Validate` method, perform the validations, and [add any errors](../services/errors#adding) to the object's `validationErrorList`.

For example, if your criteria data object has an `OrderDateFromProperty` and `OrderDateToProperty` to allow specifying a range for the *Order Date*, then you may want to validate that the *From* value is not later than the *To* value and add a validation error otherwise, as illustrated below.

```cs
public override void Validate(bool force)
{
    base.Validate(force);
    DateTime? orderDateFrom = OrderDateFromProperty.Value;
    DateTime? orderDateTo = OrderDateToProperty.Value;
// highlight-start
    if (orderDateFrom != null && orderDateTo != null && orderDateFrom > orderDateTo)
        validationErrorList.AddValidationError(Messages.OrderFromToDate);
// highlight-end
}
```

Once you validate the data object, you can retrieve a combined list of all validation errors from that object and all its child objects by calling the `GetValidationErrors` method, which returns an [`ErrorList`](../services/errors#list), so that you could display the errors and warnings to the user.

You can also manually clear the data object's own validation errors by calling `ResetValidation`, or clear it recursively for all properties and child data objects by calling `ResetAllValidation`.

### Modification tracking

Data objects allow you to track their modification state, including [modification of their data properties](properties/base#modification-tracking) and child objects. The modification state is tracked as a nullable boolean, where `null` means that the object's data has not been set, `false` means that the data was set initially, but hasn't been modified, and `true` value means that some data has been modified since it was initialized.

The combined modification state of the data object and all of its properties and child objects is returned by the method `IsModified()`. You can also call `SetModified(modState, false)` method with a nullable boolean to set the modification state of the data object, or you can call `SetModified(modState, true)` to also propagate it recursively to all the data properties and child objects.

For example, [data list objects](data-lists) set the modification state non-recursively to `true` during the insertion or deletion of their rows, which does not involve modification of any properties. [View models](vm/view-models) set it to `false` recursively after initializing the data, or after the object has been successfully saved.

Data objects also expose a regular property `Modified` of type `bool` that wraps the `IsModified` and `SetModified` methods. You can listen to the changes of this property using the regular `INotifyPropertyChanged` events, which allows you to use it in [computed properties](properties/base#computed-properties) or [actions](properties/action#enabling-conditions), indicate the modified state on the UI view, e.g. via a * next to the view title, or prompt for unsaved changes when the view is being closed.

:::tip
Some of your data objects may have an auxiliary purpose, with their data not being persisted, such as criteria objects. To suppress unwanted prompts about unsaved changes or a modification indicator, you can turn off modification tracking for such objects, which will make `IsModified` and `Modified` to always return `false`. You can do it by setting `TrackModifications` as follows.

```cs
myObj.TrackModifications = false;
```

:::
## Service operations

To populate the data object with existing data you need to call one or more service operations, just like you do to save the data object's data in the database. Therefore, the structure of data objects is usually similar to the input or output structures of those service operations.

### Conversion to DTOs

Data objects provide an easy way to convert their data to a Data Transfer Object (DTO), which would then be passed as input to a service operation. If you have a `SalesOrderUpdateDTO` that has the same structure as your `SalesOrderObject`, where the names of the properties are the same and child objects represent nested structures, then you can serialize your data objects to a DTO as follows.

```cs
object options = null; // any additional pass-through serialization options
/* highlight-next-line */
SalesOrderUpdateDTO dto = salesOrderObject.ToDataContract<SalesOrderUpdateDTO>(options);
```

This will create a DTO and will copy the data from data properties converted to the [`Transport`](properties/base#value-formats) format to the corresponding properties of the DTO. If the data property is multi-valued, then the DTO property should be of type `IEnumerable<T>` or any subtype thereof.

:::note
This method will also work for child objects where their properties are flattened in the target DTO using the *childName_propertyName* convention. For example, if your sales order object has a child object *BillingAddress*, which has a data property *City*, then your DTO can have either the same sub-structure or fields like *BillingAddress_City*.
:::

If the structure of your DTO doesn't fully follow the structure of your data object, then you can either create the DTO and fill the missing data manually as needed, or you can override the `ToDataContract` method on your data object, and handle copying of custom properties there. After that, you can call the `ToDataContractProperties` method to copy all or a subset of the data object's properties, as illustrated below.

```cs
public override void ToDataContract(object dataContract, object options)
{
    if (dataContract == null) return;
    // copy custom properties that don't follow default naming conventions
// highlight-start
    if (dataContract is MyDTO dto)
    {
        dto.CustomProperty = SourceProperty.TransportValue;
    }
// highlight-end
    // copy data for all other properties excluding the CustomProperty
    var propertiesToCopy = dataContract.GetType().GetProperties().Where(p => p.Name != "CustomProperty");
// highlight-next-line
    ToDataContractProperties(dataContract, propertiesToCopy.ToArray(), options, null);
}
```

Overriding this method will allow you to encapsulate the conversion logic within the data object, and will let the callers use the regular `ToDataContract` method, without performing any additional conversions.

### Populating from DTOs

Similar to converting data objects to a DTO, you can easily populate the data in the data object from a DTO that was returned from a service operation. For example, if the result of a `ReadAsync` service operation for a sales order returns a DTO that has the same structure as your sales order data object, then you can populate it with that result by calling `FromDataContractAsync` as follows.

```cs
using (var s = ServiceProvider.CreateScope())
{
    var output = await s.ServiceProvider.GetService<ISalesOrderService>().ReadAsync(salesOrderId, token);
    object options = null; // additional pass-through deserialization options
/* highlight-next-line */
    await salesOrderObject.FromDataContractAsync(output?.Result, options, token);
}
```

This method will set the data of all DTO properties to the corresponding data object properties, and will also populate the child data objects from the corresponding nested DTO structures. Once the data is populated, it will set the modification state of the data object to `false`, which will allow tracking modifications from this point on.

:::note
This will also work for child objects where their properties are flattened in the source DTO using the *childName_propertyName* convention. For example, if your sales order object has a child object *BillingAddress*, which has a data property *City*, then your DTO can have either the same sub-structure or fields like *BillingAddress_City*.
:::

If your data object has custom data properties that don't match the names of the source DTO properties, then you can override the `FromDataContractAsync` method, and manually set the values for those data properties, as illustrated below.

```cs
public override async Task FromDataContractAsync(object dataContract, object options,
                                                 CancellationToken token = default)
{
    // use this reusable method to populate data object (or a DataRow) from a DTO
    await FromDataContractAsync(dataContract, options, null, token);

    // set custom properties that don't follow default naming conventions
// highlight-start
    if (dataContract is MyDTO dto)
    {
        await CustomProperty.SetValueAsync(dto.SourceProperty, null, token);
    }
// highlight-end
}
```

:::warning
Data objects also provide corresponding synchronous methods `FromDataContract`, but we recommend that you use the async methods whenever possible. Setting values asynchronously allows [enum properties](properties/enum) to [load their lookup table from a remote service](lookup#load-table-from-service), and use it to resolve the full value.
:::

### IsNew property

Data objects have a boolean property `IsNew`, which allows you to track if the data object is based on an existing entity, or whether it is still being created. This flag is set to `true` when the data object is constructed but then set to `false` when the object's data is either read from a service or successfully saved to the database.

Data objects can notify about the changes of this property using the standard `INotifyPropertyChanged` interface, which allows using it in computed actions (e.g. to set enabling condition of the *Delete* action), or updating the view's title or the text of the *Save* action. You can also have some data properties that should be editable only during creation, but not on existing objects, or vice versa.

### Read operation

The base `DataObject` class has a standard `ReadAsync` method that allows the UI views to populate their main objects with data. You would need to provide the specific implementation of calling the service operation by overriding the `DoReadAsync` method, as follows.

```cs
protected override async Task<ErrorList> DoReadAsync(object options, CancellationToken token = default)
{
    int salesOrderId = (int)SalesOrderIdProperty.TransportValue;
    using (var s = ServiceProvider.CreateScope())
    {
/* highlight-next-line */
        var output = await s.ServiceProvider.GetService<ISalesOrderService>().ReadAsync(salesOrderId, token);

        await FromDataContractAsync(output?.Result, options, token);
        return output.Messages;
    }
}
```

As you can see, you need to call the corresponding service operation within a separate service scope, [populate the data object](#populating-from-dtos) properties from the result, and return any error messages from the service call.

Your result can either return the data for the entire data object, including any child objects (i.e. eager fetch), or you can override the `DoReadAsync` on each specific child object to allow reading the data for that child object using a separate service operation (i.e. lazy loading).

When you use the main `ReadAsync` method in the latter case, you can control whether it should also read the child objects, and how it should do it, by passing an instance of the `DataObject.CrudOptions` class as the options, and setting one of the following parameters.

- `Recursive` - indicates if it should read child objects recursively (default is `true`).
- `Parallel` - indicates if it should read child objects in parallel for faster loading (default is `true`).
- `AbortOnErrors` - indicates if it should stop immediately on any errors when reading child objects (default is `true`).
- `PreserveSelection` - a flag indicating whether or not to preserve selection in [data lists](data-lists) (default is `false`).

So, calling the `ReadAsync` method on your data object could look as shown below.

```cs
await myObject.ReadAsync(new DataObject.CrudOptions() {
    Recursive = true,
    Parallel = false,
    AbortOnErrors = true
});
```

As mentioned [above](#isnew-property), reading the data for the data object like this will automatically set its `IsNew` property to `false`.

:::warning
`DataObject` also has a legacy synchronous method `Read`, which would call the `DoRead` that you can override and call a service operation synchronously. However, we **do not recommend** using this method, and you should use the async version instead, whenever possible.
:::

### Save operation

Similar to the `Read` operation, data objects provide a standard `SaveAsync` method, which allows you to save the data in the backend by calling one or more service operations. UI views then can use this method for the main *Save* button. You will need to provide the actual implementation of calling the service operations in the overridden method `DoSaveAsync` on your data object.

The `DoSaveAsync` method should handle both saving a newly created object and an existing object. This may be supported by either a single service operation or by two separate operations - *Create* and *Update*, which can be exposed differently via REST (e.g. using POST and PUT methods respectively). In this case, you can leverage the [`IsNew`](#isnew-property) flag of the data object to determine which operation to call, as illustrated in the following snippet.

```cs
protected override async Task<ErrorList> DoSaveAsync(object options, CancellationToken token = default)
{
    using (var s = ServiceProvider.CreateScope())
    {
        var svc = s.ServiceProvider.GetService<ISalesOrderService>();
        if (IsNew)
        {
            var createData = ToDataContract<SalesOrder_CreateData>(options);
// highlight-next-line
            var createOutput = await svc.CreateAsync(createData, token);

            // update data object with the result of the create, e.g. set the new SalesOrderId.
            await FromDataContractAsync(createOutput?.Result, options, token);
            return createOutput.Messages;
        }
        else
        {
            int salesOrderId = (int)SalesOrderIdProperty.TransportValue;
            var updateData = ToDataContract<SalesOrder_UpdateData>(options);
// highlight-next-line
            var updateOutput = await svc.UpdateAsync(salesOrderId, updateData, token);
            return updateOutput.Messages;
        }
    }
}
```

:::note
The `SaveAsync` method will first [validate the data object](#validation), and won't start the save if there are any validation errors. It will also automatically set both the [`Modified`](#modification-tracking) and [`IsNew`](#isnew-property) properties to `false` after a successful save, which means that after you save a new object, any subsequent saves will call the *Update* operation rather than the *Create*.
:::

In addition to the `SaveAsync` methods, data objects define an [action property](properties/action) `SaveAction`, which can be bound to the *Save* button on the UI view. The `SaveAction` is configured to be enabled only when the data object is modified, but you can change this behavior in your data object as needed.

If your child data objects call separate service operations during save in their overridden `DoSaveAsync` methods, then the `SaveAsync` method on the parent data object can call them all as part of the save. You can control how to call them, such as whether they should be executed in parallel, by passing a `DataObject.CrudOptions` configuration as the save options.

:::tip
Unlike reading data, it is recommended to **perform the save as a single service call**, so that it's part of the same transaction. If you save using multiple service calls, and some of them fail while others succeed, then you may need to manually revert the changes, or otherwise deal with inconsistent data being saved.
:::

:::warning
Just like with the `Read`, the `DataObject` class has legacy methods `Save` and the corresponding `DoSave`. You should **avoid using those synchronous methods**, and use the asynchronous `SaveAsync` and `DoSaveAsync` methods instead, whenever possible.
:::

### Delete operation

In addition to the *Read* and *Save* operations, data objects define a standard `DeleteAsync` method that can be called by the *Delete* button in the UI view. To follow the same convention, you should provide the implementation for calling the *Delete* service operation in the overridden method `DoDeleteAsync`, which is called from the `DeleteAsync`, as shown below.

```cs
// highlight-next-line
protected override async Task<ErrorList> DoDeleteAsync(object options, CancellationToken token = default)
{
    int orderId = (int)SalesOrderIdProperty.TransportValue;
    using (var s = ServiceProvider.CreateScope())
    {
// highlight-next-line
        var output = await s.ServiceProvider.GetService<ISalesOrderService>().DeleteAsync(orderId, token);

        return output.Messages;
    }
}
```

The `DeleteAsync` method doesn't do anything additional, but the data object also provides an [action property](properties/action) `DeleteAction` that can be bound to the *Delete* button. The `DeleteAction` is set up to be enabled only for existing objects, i.e. if the [`IsNew`](#isnew-property) property is `false`.

:::warning
The `DataObject` class also has legacy methods `Delete` and `DoDelete`. You should **avoid using those synchronous methods**, and use the asynchronous `DeleteAsync` and `DoDeleteAsync` methods instead, whenever possible.
:::
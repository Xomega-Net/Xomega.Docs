---
sidebar_position: 0
---

# Data Properties

The central part of the data models for UI views in Xomega Framework is data properties that make up regular data objects and data list objects. Unlike regular object properties in C#, they provide rich functionality for handling the property values, which is used for viewing and editing them on the screens. Here's a quick summary of the features it provides.

- **Multi-valued properties** allow storing and handling a list of values in the same property, as opposed to just a scalar value.
- **Value conversion** allows converting values between multiple formats, such as `Internal`, `DisplayString`, `EditString` or `Transport`. For multi-valued properties, this converts each individual value between those formats and also provides a way to format the display of the entire list of values.
- **Property description** stores the internal property name, as well as a localizable user-friendly label that can be used in the UI views and in any error messages, such as validation errors.
- **Property metadata** handles such things as editability, visibility, security access level and whether or not the property is required. All of that can be reflected in the bound UI control by making it read-only or hidden, or by denoting a required field.
- **Property change events** - unlike the standard MVVM's `INotifyPropertyChanged`, data properties can automatically notify you about changes in both the value and any of its metadata, or any combination thereof. This is used by the framework for property bindings and computed properties, but you can also leverage it for implementing your presentation logic.
- **Async support** allows you to handle any property changes asynchronously, e.g. by fetching data from remote business services.
- **Value validation** checks if the current value is valid and reports validation errors if it's not. This allows you to store an invalid value while the user edits it, and prevents them from submitting an invalid value to the backend.
- **Modification tracking** helps you track when a property value has been modified.
- **Possible values provider** of the property helps you to associate a list of possible values that can be used by the bound selection controls for selecting the value(s) of the property, as well as to validate the current value(s).
- **Data list object support** allows you to reuse the same property with all its metadata, change events, value conversion and validation rules in a tabular data list object, where it would serve as one of the columns, without storing the actual value(s) directly.

Xomega Framework provides the base classes for all data properties, as well as a number of standard and specialty properties. It also allows you to create subclasses for your own custom data properties, e.g. a `CreditCardNumberProperty`, which would define its own way to store the values, convert them to various formats, validate them and so forth. Once you define such a property, the framework's design allows you to reuse it in your data objects - either for a single value, for multiple values, or as a column in a data list object.

## Initialization and description

Normally, data properties are part of a data object and have a unique name within that data object. Therefore, constructing a data property requires a parent data object and the property name passed to the constructor. The data object would typically declare the property and a constant for the property name, and then create the property in its `Initialize` method as follows.

```cs
public partial class SalesOrderObject : DataObject
{
    public const string OrderDate = "OrderDate";
    public DateTimeProperty OrderDateProperty { get; private set; }
    ...
    protected override void Initialize()
    {
/* highlight-next-line */
        OrderDateProperty = new DateTimeProperty(this, OrderDate);
    }
}
```

This will automatically register the data property with its parent data object under the specified name.

### Property initialization

Typically all data properties that store or handle data inherit from the `DataProperty` base class, or some subclass thereof. If you need to perform additional initialization in your custom data property, such as setting up validators, value converters, items providers, etc., then you can do it in the property constructor, as follows.

```cs
public DateTimeProperty(DataObject parent, string name) : base(parent, name)
{
/* highlight-next-line */
    Validator += ValidateDateTime;
}
```

:::warning
If your initialization code needs to **access other properties** of the parent object, then those may not be created yet when your property is being constructed. Therefore, you will need to override the `Initialize` method of the property and perform any such initialization in that method.
:::

### Property name

As we mentioned above, the property name should be unique within its parent data object and is passed to the property constructor. The parent object allows you to look up any property by its name, and the property name can be used to identify the property in the UI control bindings.

:::tip
That's why declaring a constant for the property name will allow you to use that constant in various bindings, without having to hardcode the property name.
:::

The property name is also used as a resource key to look up the user-friendly localized label for the property, as explained below.

### Property label

The property label is a localized user-friendly description of the property, which can be used by the bound UI controls, as well as in any error messages related to that property. By default, the `ToString`()` method will also return the label.

The property will look up the localized text for the label in the current ([hierarchical](../../services/errors#resources)) resource manager using its name as the resource key and the parent resource key as the prefix.

For example, if you have an `OrderDate` data property on the `SalesOrderObject`, then Xomega Framework will look up the label text under the `SalesOrderObject.OrderDate` key, and then fall back to the default `OrderDate` key, if the former is not defined. If no such resources are found, it will construct the label from the property's `Name`.

:::note
You can customize which resource manager, resource key and parent resource key are used by overriding the `ResourceMgr`, `ResourceKey` and `ParentResourceKey` properties respectively.
:::

In addition to a label, a property can also provide a localizable `AccessKey`, which should be defined in the resources under the same key as the property, but with the *_AccessKey* at the end, e.g. `SalesOrderObject.OrderDate_AccessKey`. The access key would be a single letter, e.g. "D", which the bound UI control can underscore in the displayed label as a mnemonic, and also set up a keyboard shortcut to bring focus to the bound field, e.g. `Alt+D`.

:::note
You can also manually set the label on the property, which will override any defined resources. For that, you can set the `Label` property, or call the `SetLabel` method, which will strip off the trailing colon. This is called by some bound UI controls that already have a label defined directly on the screen to ensure that any error messages also use the same label.
:::

## Property values

The data property's values are stored internally as an `object`, which allows storing any type of value, as well as using collections for storing the values of multi-valued properties. Every concrete data property uses a certain data type for its internal values, such as `DateTime?` for the `DateTimeProperty`. Whenever you set the value of the property using the `SetValue` or `SetValueAsync` methods, it will try to convert that value to the target data type.

:::caution
If the property fails to convert the provided value you are setting to the target data type, it will still store that value "as is" in the data property. However, validating the property will result in errors, which won't let you submit the data to the services. This allows the property to capture the user's input as they type it, even if it's not yet valid.
:::

You can get the data property's value converted to a specific format by calling the `GetValue` method and passing a specific format. This method would return the value as an object, but Xomega Framework provides a number of other value accessors that can return typed values for each format, as you will see below.

### Value formats

The different formats that data property values can be converted to are represented by the class `ValueFormat`. Xomega Framework defines the following static formats that you can convert values to.

- `ValueFormat.Internal` - the format in which values are stored internally in data properties. This format is typically typed, that is an integer value would be stored as an `int?`.
- `ValueFormat.Transport` - the format in which data property values are transported between layers during a service call. The format is typically typed and may or may not be the same as the internal format. For example, we may want to store a resolved `Header` object internally, but send only the ID part in a service call.
- `ValueFormat.EditString` - the string format in which the user inputs the value. It may or may not be the same as the format in which the value is displayed to the user when it's not editable. For example, a `MoneyProperty` may display the value using a currency format, but have the user input regular decimal numbers.
- `ValueFormat.DisplayString` - the string format in which the value is displayed to the user when it's not editable. When the internal value is such an object as a `Header`, the display string may be just its text attribute or a combination of several attributes.

The `ValueFormat` also provides the following two methods for classifying the value formats.
- `IsTyped()` - checks if the current format is one of the typed formats, i.e. the first two formats.
- `IsString()` - checks if the current format is one of the string formats, i.e. the last two formats.

:::tip
If you need to define your custom formats, you can subclass the `ValueFormat` class, add static read-only members for your custom formats, and override the `IsTyped` and `IsString` methods accordingly. Then you can use those custom formats in your properties for value conversion.
:::

### Value conversion

Each data property provides a way to convert a value into the specified format using its `ResolveValue` or `ResolveValueAsync` methods, as follows.

```cs
var convertedValue = myProperty.ResolveValue(originalValue, ValueFormat.DisplayString);
var convertedValue = await myProperty.ResolveValueAsync(originalValue, ValueFormat.DisplayString, token);
```

These methods are used when you set the value of the data property for converting it to the `Internal` format. They handle special cases, such as null values, and work on the entire value of the property, meaning that if the property is configured as multi-valued, then the `convertedValue` will be an `IList` of values, as you'll see below.

#### Null values

To determine if the specified value is null for the given format, the data property uses its `IsValueNull` method, which by default considers empty strings or empty lists also as nulls, but you can override it to use different rules.

:::tip
You can also configure the data property to show a specific string in the `DisplayString` format when the property value is null. This will allow you to make it more clear to the user, as opposed to just showing an empty space on the screen. You can do it by setting its `NullString` property, as follows.
```cs
dataProperty.NullString = "[Not Set]";
enumProperty.NullString = "Select a value...";
```
:::

#### Converting individual values

In order to actually convert a scalar value, or an individual value of a multi-valued property, to the specified format, the `ResolveValue` and `ResolveValueAsync` methods delegate it to the `ConvertValue` or `ConvertValueAsync` methods respectively. Those are the ones that you can override in custom data properties to implement the actual value conversion. You can call the `base` method for any invalid values, or if you don't know how to convert it.

:::tip
If converting a value for your property does not require any async calls, e.g. to look it up in a `LookupTable`, then you can just override the `ConvertValue` method, and the `ConvertValueAsync` will automatically use it when called asynchronously.
:::

If you want to customize the conversion behavior of an existing data property without creating a custom subclass, then you can also set custom `ValueConverter` and/or `AsyncValueConverter` functions on your property, where you try to convert the value and return `true` on success, as follows.

```cs
rateProperty.ValueConverter = (ref object val, ValueFormat fmt) => {
    if (fmt == ValueFormat.DisplayString && val is decimal)
    {
        val = ((decimal)val).ToString("C4");
        return true;
    }
    return false; // fall back on ConvertValue
};
```

#### Getting formatted property value

The base `DataProperty` provides the following convenient accessors for its value in various formats.
- `InternalValue` - returns the property value as an `object` as it is stored internally.
- `TransportValue` - returns the property value as an `object` in a transport format. Multiple values will be returned as a list of values converted to the transport format.
- `EditStringValue` - returns the property value as a `string` in the `EditString` format. Multiple values are each converted to the edit string format and combined into a delimited string.
- `DisplayStringValue` - returns the property value as a `string` in the `DisplayString` format. Multiple values are each converted to the display string format and combined into a delimited string.

### Multi-valued properties

In order to configure a property that can hold multiple values, you should set the `IsMultiValued` flag to `true`. In this case, calling `ResolveValue` or `ResolveValueAsync` will create an `IList` from the provided value, convert each value to the specified format, and will add them to that list using the following rules.
- If the value is already an `IList`, then it will convert the values of that list.
- If the value is a `string`, then it will parse it based on the property's `ParseListSeparators` (by default `","`, `";"` and `"\n"`).
- Otherwise, it will create a new list and will add the provided value to it as a single element.
- The list will be created by calling the `IList CreateList(ValueFormat format)` method, which is overridden in concrete data properties to return a typed list, e.g. `new List<int>()`.

The following code block illustrates these rules when setting a value of a multi-valued property.

```cs
/* highlight-start */
var prop = new IntegerProperty(null, "IntProperty");
prop.IsMultiValued = true;
/* highlight-end */

await prop.SetValueAsync(5); // prop.InternalValue is a List<int> with a single element 5.

prop.SetValue(new[] { "1", "3" }.ToList()); // internal value is a List<int> with two elements: 1 and 3.

prop.SetValue("1, 2; 3"); // internal value is a List<int> with three elements: 1, 2 and 3.
```

When you resolve a value to a string format, you'll get a `List<string>` with each value converted to the specified string format. To get the entire property value as a string, `DataProperty` provides `DisplayStringValue` and `EditStringValue` accessors, which create a concatenated string using the property's `DisplayListSeparator` (by default `", "`), as illustrated by the following code.

```cs
/* highlight-start */
var prop = new MoneyProperty(null, "MoneyProperty");
prop.IsMultiValued = true;
/* highlight-end */

object val = prop.ResolveValue(5, ValueFormat.DisplayString); // val is a List<string> with 1 element "$5.00".
string dispVal = prop.ValueToString(val, ValueFormat.DisplayString); // = "$5.00"

prop.SetValue("1, 2; 3");
prop.DisplayListSeparator = "; "; // set a custom list separator, default is ", "
dispVal = prop.DisplayStringValue; // = "$1.00; $2.00; $3.00"
dispVal = prop.EditStringValue; // = "1; 2; 3"
```

:::tip
For total control of how your multi-valued property displays its values as a string, you can override the following method:
```cs
string ListToString(IList list, ValueFormat format);
```
For example, if a property may contain a long list of values, you can display them as comma-separated, but with a new line after every 10th value, to provide a more readable tabular display with 10 columns.
:::

### Accessing typed values

Even though the data property value is converted to a typed value when you set it, the `InternalValue` accessor returns an `object`, which may not be very convenient when using it in your presentation logic. Normally, it's better to be able to access the typed value(s), much like you do with regular C# properties.

Therefore, Xomega Framework provides a generic subclass of a data property `GenericDataProperty<T>`, which most of the standard data properties inherit from. This class provides two typed accessors `Value`, which returns the scalar value of type `T`, and `Values`, which returns a `List<T>` for multi-valued properties.

The standard properties typically use a `Nullable` type parameter for value types to allow storing a `null` value there, as follows.

```cs
public class DecimalProperty : DataProperty<decimal?> {...}
```

This will allow you to access its `Value` as a typed `decimal?`, or its `Values` as a `List<decimal?>`, as illustrated below.

```cs
var scalarProp = new DecimalProperty(null, "Scalar");
/* highlight-start */
scalarProp.Value = 5; // should be a typed value
decimal? val = scalarProp.Value; // typed value
/* highlight-end */

var multiProp = new DecimalProperty(null, "MultiValued");
multiProp.IsMultiValued = true;
/* highlight-start */
multiProp.Values = new List<decimal?> { 1, 3, 5}; // should be a typed value
List<decimal?> vals = multiProp.Values; // typed list of values
/* highlight-end */
```

:::note
Generic data properties have additional methods `GetValue` and `GetValues` to access typed value(s) respectively. Those also allow you to pass a `DataRow` to extract the value from when the property is part of a data list object.
:::

:::caution
If the internal property value is invalid and not of the proper type, then `Value`/`GetValue` will return `null`, while the `Values`/`GetValues` won't include that value in the returned `List<T>`.
:::

### Modification tracking

Data properties allow tracking modification state of its value(s) using its nullable boolean property `Modified` of type `bool?`. When the property is initially created, the `Modified` state is set to `null`, meaning that it's not initialized.

After you read the data for the parent object and set the value of that property for the first time, the `Modified` state will be set to `false`, which means that the property has been initialized, but not modified. Setting another (different) value from there on will mark the property as modified.

:::info
Determining if the new value is the same as the current value is done by the method `ValuesEqual`, which you can override in each property. By default, it uses `Equals` to compare scalar values, and `SequenceEqual` to compare lists, meaning that the order of the values in multi-valued properties matters.
:::

The modification state of the data properties is used by the framework to determine if the data objects they belong to are modified, in order to prompt for unsaved changes when the view is being closed or reloaded. If the property is modified, it will remain so even if you set the value back to the original value. You'd need to set the `Modified` flag back to `false` in order to reset it.

You generally don't need to manually reset the modification state of each property, as they are all reset automatically when the parent data object is successfully saved. When you create a new object, as opposed to reading the data of an existing object, the framework will set the initial `Modified` state to `false` to start tracking modifications right away.

:::note
Data properties also have methods `GetModified` and `SetModified` that can accept a `DataRow`, which allows you to track modification of the current property in the specific row of the parent data list object.
:::


### Property validation

The validation state of the current value of a data property is tracked by an [`ErrorList`](../../services/errors) of validation errors, which you can get by calling the `GetValidationErrors` method, which returns them as follows.
- `null` means that the validation has not been performed since the property value last changed.
- An empty list means that the validation has been performed and the value is valid.
- A non-empty list means that the value has been validated and is not valid if the list contains any errors.

As you see, changing the property value will reset the validation state of the property, but you can also reset it manually by calling the `ResetValidation` method.

The validation is triggered automatically as needed when you stop editing the property, e.g. when you tab off the field. You can also manually trigger the validation by calling the `IsValid` or `Validate` methods, where you can pass a boolean flag to always revalidate the value, even if it hasn't changed since the last validation.

:::info
Only **editable and visible** data properties will be validated. The validation process will also automatically notify any listeners, such as the bound UI controls, which could refresh their validation state and display any validation errors.
:::

The actual validation is performed by the `Validator` delegate that is configured by the property. For scalar properties, it validates their value, but for multi-valued properties, it validates each individual value in the list. You can combine multiple validation functions in the `Validator`, as shown below.

```cs
public DecimalProperty(DataObject parent, string name) : base(parent, name)
{
    ...
/* highlight-start */
    Validator += ValidateDecimal;
    Validator += ValidateMinimum;
    Validator += ValidateMaximum;
/* highlight-end */
}
```

:::note
The base `DataProperty` initializes the `Validator` with a default `ValidateRequired` method, so you typically want to add additional validations to it in the subclasses. If you don't want any default validations though, then you can assign and build your `Validator` from scratch.
:::

Each validation function accepts the data property and can be declared as static so that you could reuse them between various properties. The validation function uses a configuration of the data property to validate the passed value and adds localized validation errors to the property by calling its `AddValidationError` method, as illustrated below.

```cs
/* highlight-next-line */
public static void ValidateDecimal(DataProperty dp, object value, DataRow row)
{
    if (dp != null && !dp.IsValueNull(value, ValueFormat.Internal) && !(value is decimal))
/* highlight-next-line */
        dp.AddValidationError(row, Messages.Validation_DecimalFormat, dp.Label);
}

/* highlight-next-line */
public static void ValidateMinimum(DataProperty dp, object value, DataRow row)
{
    if (dp is DecimalProperty ddp && (value is decimal?))
    {
        if (ddp.MinimumAllowed && ((decimal?)value).Value < ddp.MinimumValue)
/* highlight-next-line */
            dp.AddValidationError(row, Messages.Validation_NumberMinimum, dp.Label, ddp.MinimumValue);
        else if (!ddp.MinimumAllowed && ((decimal?)value).Value <= ddp.MinimumValue)
/* highlight-next-line */
            dp.AddValidationError(row, Messages.Validation_NumberMinimumExcl, dp.Label, ddp.MinimumValue);
    }
}
```

When adding validation errors you can pass a constant for the message resource key and the message arguments, as described [here](../../services/errors#adding).

:::note
For data properties in a data list object, you can also pass a `DataRow` to all of the validation methods to track the validation state of this property for a specific row.
:::

## Property metadata

In addition to storing and handling the value, all Xomega Framework properties (i.e. subclasses of the `BaseProperty`) maintain various metadata, such as editability, visibility, security access level and whether or not the property is required.

This metadata is typically reflected in the state of the property-bound UI controls, which gets updated whenever such metadata is changed and also affects the way the property value(s) are handled or validated.

### Property editability

The `BaseProperty` class maintains a property `Editable`, which determines whether or not the current data property should be editable by the user. The data property itself does not prevent setting a new property value when it's not editable, but the bound UI control should become un-editable/read-only, and prevent the user from changing the value.

You can manually make the property not editable by setting `Editable = false`. However, even if you set `Editable = true` the final editable state of the property is also determined by its [security access level](#access), which should be greater than `ReadOnly`, as well as by calling the parent object's method `IsPropertyEditable` for the current property. The latter makes sure that all its parent objects are also editable, which allows you to turn off the editability of all the data properties when their parent object is not editable.

:::tip
You can also override the `IsPropertyEditable` method in your parent data object, and implement custom logic that determines when the property should be editable. However, you'd have to make sure to fire the appropriate property change event when your custom editability conditions change.
:::

In addition to the editable flag, data properties can also maintain an `Editing` flag, which tracks when the user starts and stops editing the property value. It is typically set to `true` by the bound UI control when the value is changed and then reset to `false` when the user stops editing or leaves the UI control.

Any changes in the `Editing` flag fire a property change event, which allows you to implement UI-independent presentation logic on such events. Xomega Framework, for example, performs a validation of the property value when the user stops editing, which may in turn display validation errors and update the state of the UI control.

:::note
In addition to the `Editable` and `Editing` properties, the `BaseProperty` provides corresponding methods `GetEditable`, `SetEditable`,  `GetEditing` and `SetEditing` respectively. Each one of them accepts an optional `DataRow` to allow retrieving or setting the editable or editing flags of the current property for the specified row when the property is part of a data list object.
:::

### Property visibility

The `BaseProperty` class maintains a property `Visible`, which determines whether or not the current data property should be visible on the UI screen. The bound UI control and any associated label (or the corresponding grid column) should be hidden when `Visible` returns `false`. If `Visible` changes to `true` though, a property change event will be fired, and it should become visible on the screen.

You can manually make the property not visible by setting `Visible = false`. However, even if you set `Visible = true` the final visible state of the property is also determined by its [security access level](#access), which should be greater than `None`.

### Security access level{#access}

Access to different data properties may be subject to security restrictions based on the claims of the current user. Some users may have read-only access to some data, or no access to other sensitive data. To track that for each property, the `BaseProperty` class has an `AccessLevel` property, which can be one of the following values.
1. `AccessLevel.None` - the user can neither view nor modify the property.
1. `AccessLevel.ReadOnly` - the user can view the property, but not modify it.
1. `AccessLevel.Full` - the user can both view and modify the property.

:::tip
The `AccessLevel` enum values are ordered in ascending order, so you can use not only an equality operator but also comparison operators, e.g. `AccessLevel > AccessLevel.None`.
:::

When the access level of a property is less than `Full`, then the property will be not editable, and when it's less than `ReadOnly`, then the property will be not visible. Therefore, changing the `AccessLevel` on the property will send a [property change event](#property-change-events) for both the `Editable` and `Visible` flags, since it may affect either of them.

:::caution
If the user should have **no access** to a certain property, security best practices recommend that your business services **do not return any data** for that property, e.g. return `null`. Just hiding that property on the UI may not be secure enough when the business services are accessed via REST, since one can easily just view the results returned by the REST API.
:::

### Required indicator

The `BaseProperty` class maintains a `Required` flag, which determines whether or not the current data property should be required. The bound UI control may visually indicate required fields, e.g. by adding a red asterisk to the associated label.

When the value of the `Required` flag changes, a corresponding property change event will be fired, and the UI control should update its visual indicator on the screen.

Data properties use the `Required` flag during validation to add a validation error when the [value is `null`](#null-values).

## Property change events

All data properties support advanced and extensible property change events, which allow you to notify and listen to various changes that occur in the properties. Following are some advanced features of the property change notifications.
- Sending a single notification about **multiple changes** in the property at once.
- Support for **async notifications**, which allows waiting for all async listeners to complete.
- Supporting notifications related to **specific `DataRow`**, when the property is part of a data list object.

Property change events are used by various property bindings to keep the bound UI controls in sync with the property, as well as by computed bindings, to support computed values. You can also use these notifications to implement your presentation logic independent of any specific UI framework.

### Property changes

Xomega Framework describes the change(s) that occur in data properties using the `PropertyChange` class. At its core, it constitutes a combination of the flags, with each flag representing a specific property change. This class doesn't provide a public constructor, but it has a number of standard property changes exposed as static constants, as listed below.

- `PropertyChange.All` - a combination of all changes. Used to trigger refresh for all property attributes, e.g. during initialization.
- `PropertyChange.Value` - a change in property value(s).
- `PropertyChange.Editable` - a change in property editability.
- `PropertyChange.Editing` - a change in whether or not the property is being edited.
- `PropertyChange.Required` - a change in whether or not the property is required.
- `PropertyChange.Items` - a change in the property's list of possible items.
- `PropertyChange.Visible` - a change in property visibility.
- `PropertyChange.Validation` - a change in property validation status.

You can construct a property change for any combination of the above constants using the + (or -) operators, as follows.

```cs
PropertyChange change = PropertyChange.Editable + PropertyChange.Visible;
```

You can check whether a change includes any specific attribute by using dedicated methods that return a `bool`, e.g. `change.IncludesValue()` to check if the property change includes a value change. You can also use a generic method `IncludesChanges` to check if the changes include any of the supplied changes, as follows.

```
change.IncludesChanges(PropertyChange.Editable + PropertyChange.Visible)
```

:::tip
If you need to introduce a custom property change that you want to notify about, you can subclass the `PropertyChange` class, and define your own constants using unused flags, as follows.

```cs
public class MyPropertyChange : PropertyChange
{
/* highlight-next-line */
    public static readonly PropertyChange MyChange = new MyPropertyChange(1 << 10);

    protected MyPropertyChange(int change) : base(change) {}
}
```
:::

### Subscribing to change events

To listen to property change events, you can add your event handler to the property's `Change` event. The `sender` argument will be the property, and the `PropertyChangeEventArgs` argument will contain the details of the change(s). To make sure that your handler executes only on the needed property change(s), you should check the [`Change`](#property-changes) member of the event arguments, as illustrated below.

```cs
property.Change += OnDataPropertyChange;
...
void OnDataPropertyChange(object sender, PropertyChangeEventArgs e)
{
/* highlight-next-line */
    if (e.Change.IncludesValue())
    {
        // TODO: implement your listener of a property value change event
    }
}
```

Using property change notifications you can implement some presentation logic, where the state of some properties depends on the value of other properties. For example, in cascading selection, changing a property value would affect the list of possible values (and the value) of a dependent property. Or one property may be required based on the value of another property.

:::info
The `PropertyChangeEventArgs` allows you to access the `OldValue` and `NewValue`, where available, as well as the `Row` member, in order to get the `DataRow` that was changed when the property is part of a data list object.
:::

If your property change handler needs to perform any async operations that should be awaited, then you should add your async handler to the property's `AsyncChange` event, as follows.

```cs
property.AsyncChange += OnDataPropertyChangeAsync;
...
/* highlight-next-line */
async Task OnDataPropertyChangeAsync(object sender, PropertyChangeEventArgs e, CancellationToken token)
{
    if (e.Change.IncludesValue())
    {
        await MyMethodAsync(token);
    }
}
```

:::caution
Only the async listeners for the **value change** will be awaited, provided that the value was changed via `SetValueAsync`. Any other property changes, such as `Editable`, will also trigger the async listeners, but those will not be awaited.
:::

### Firing change events

Normally, setting the property value or other metadata will automatically fire the property change events, as needed. However, properties allow you to manually trigger any property change event by calling the `FirePropertyChange` method, as follows.

```cs
prop.FirePropertyChange(new PropertyChangeEventArgs(PropertyChange.Editable, oldValue, newValue, row));
prop.FirePropertyChange(new PropertyChangeEventArgs(PropertyChange.Items, null, null, e.Row));
```

This is most common for the `PropertyChange.Items` change notification when the list of possible values for the property must be refreshed. If you operate within an async method, then you better use the `FirePropertyChangeAsync` method, which will invoke and await for both synchronous and asynchronous listeners, as illustrated below.

```cs
await prop.FirePropertyChangeAsync(new PropertyChangeEventArgs(PropertyChange.Items, null, null, e.Row));
```

:::note
Calling `FirePropertyChange` will also invoke async listeners, but it won't wait for them, which could cause issues.
:::

## Computed properties

Oftentimes, the value or state of a property depends on the values or states of other properties or objects. For example, the value of the *UnitPrice* property may depend on the selected product, and the value of the *Line Total* property may be calculated as a formula based on the values of the *Quantity*, *UnitPrice* and *Discount* properties.

You can always create a set of listeners that listen to the changes in other properties or objects and recalculate the value or state of your property accordingly. While this could be the most straightforward way, it’s not the simplest or the most natural one. Adding all these property listeners that recalculate values of other properties can get very tedious.

And even after you add them all, you will have a hard time understanding how each computed property is calculated. You also need to be very careful when changing any of the calculations to make sure you add new listeners for any additional properties that the computed value uses, and remove the listeners for the properties that it no longer depends on.

A more natural way to define computed properties is to just express the formula for calculating the value, and let the system update the computed value whenever the other properties change. This would be similar to defining such formulas for calculated cells in an Excel spreadsheet. Data properties support computed bindings for values, editability, visibility and the required flag.

### Computed value

When the value of your property is computed based on the values of other properties, you can create an `Expression` for a `Func` that accepts arguments needed to get the dependent values, and returns the calculated value as an `object`. The arguments can be either the dependent properties or their parent objects. Then you can call `SetComputedValue` on your property, and pass that expression and the actual properties or objects for the expression's arguments.

:::caution
Setting computed value will also make the property neither `Editable` nor `Required` to ensure that the user would not be able to set it manually, and to turn off the required validation.
:::

For example, when the value of the `UnitPriceProperty` comes from an attribute of the selected product, then you can create an expression that takes its parent `SalesOrderDetailObject` and extracts the price from the `ProductProperty`. Then you'd pass it to the `SetComputedValue` method, along with the instance of the parent `SalesOrderDetailObject` (i.e. `this`), as follows.

```cs
// computed property using the entire object
/* highlight-next-line */
Expression<Func<SalesOrderDetailObject, object>> xPrice = sod =>
    sod.ProductProperty.IsNull() ? null : sod.ProductProperty.Value["list price"];
/* highlight-next-line */
UnitPriceProperty.SetComputedValue(xPrice, this);
```

Alternatively, you can create an expression that takes specific properties. For example, if the value of the `DiscountProperty` is retrieved from an attribute of the `SpecialOfferProperty`'s value, then you can create an expression that takes an `EnumProperty` for it, and then pass it to the `SetComputedValue` along with the `SpecialOfferProperty` instance, as follows.

```cs
// computed property using individual property
Expression<Func<EnumProperty, object>> xDiscount = spOf => spOf.IsNull() ? null : spOf.Value["discount"];
/* highlight-next-line */
DiscountProperty.SetComputedValue(xDiscount, SpecialOfferProperty);
```

If your computed property is part of a data list object, then your expression can have a `DataRow` as the last argument to allow retrieving values of other properties from the same row, e.g. `Expression<Func<EnumProperty, DataRow, object>>`. You'd still pass the same parameters to the `SetComputedValue` method though, i.e. without passing an instance of the row, as it's provided automatically.

:::tip
Your expression can also use regular properties of any objects that implement the standard `INotifyPropertyChanged` interface, and the computed value will be automatically updated when the values of such properties change.
:::

When the calculation is not trivial, especially with all the handling of possible `null` values, then your expression can become unwieldy. In this case, you can create a separate function that calculates the result from the input values, and use that function in your expression.

In the following example, the value of the `LineTotalProperty` is calculated from the *unit price*, *discount* and *quantity* using a separate method `GetLineTotal`, so we can just pass the parent data object to the expression, and call that function using its values, as follows.

```cs
// computed total using a helper function
/* highlight-next-line */
Expression<Func<SalesOrderDetailObject, decimal>> xLineTotal = sod => GetLineTotal(
    sod.UnitPriceProperty.Value,
    sod.UnitPriceDiscountProperty.Value,
    sod.OrderQtyProperty.Value);
/* highlight-next-line */
LineTotalProperty.SetComputedValue(xLineTotal, this);
```

Using helper functions like this will allow you to keep the expressions easy to read and implement, since you will no longer be limited by the expression syntax in the helper functions, and can use the full gamut of C# features there.

:::note
You can always manually trigger a recalculation of the computed property by calling `await prop.UpdateComputedValueAsync()`. You can also pass it a `DataRow` when the property is part of a data list object.
:::

### Computed editability

When the editability of your data property depends on the values of other properties, you can create an `Expression` for a `Func` that returns a `bool`, and pass it to the `SetComputedEditable` method along with the instances of the other arguments for the expression.

Imagine that you have an enumerated `ReasonProperty` that allows the user to select a reason from a certain list of values. One such value could be *Other*, selecting which would make the free-text `ReasonDetailsProperty` editable to provide custom details. To set this up you can create a boolean expression, and pass it to the `SetComputedEditable` method, as follows.

```cs
// computed editable attribute based on the value of the selected reason
Expression<Func<EnumProperty, bool>> xOtherReason = reason => reason.Value?.Id == ReasonEnum.Other;
/* highlight-next-line */
ReasonDetailsProperty.SetComputedEditable(xOtherReason, ReasonProperty);
```

:::note
You can always manually trigger a recalculation of the computed `Editable` by calling `prop.UpdateComputedEditable()`. You can also pass it a `DataRow` when the property is part of a data list object.
:::

### Computed visibility

When the visibility of your data property depends on the values of other properties, you can create an `Expression` for a `Func` that returns a `bool`, and pass it to the `SetComputedVisible` method along with the instances of the other arguments for the expression.

In the following example, the `UnitPriceDiscountProperty` is configured to be visible only when its (computed) value is greater than 0.

```cs
// computed visible attribute based on discount value
Expression<Func<PercentFractionProperty, bool>> xVisible = dp => !dp.IsNull() && dp.Value > 0;
/* highlight-next-line */
UnitPriceDiscountProperty.SetComputedVisible(xVisible, UnitPriceDiscountProperty);
```

:::note
You can always manually trigger a recalculation of the computed `Visible` by calling `prop.UpdateComputedVisible()`.
:::

### Computed required

When your data property must be required based on the values of other properties, you can create an `Expression` for a `Func` that returns a `bool`, and pass it to the `SetComputedRequired` method along with the instances of the other arguments for the expression.

Imagine that the `ReasonDetailsProperty` from [above](#computed-editability) is configured to be always editable instead, but should be required only when the selected value of the `ReasonProperty` is *Other*. To set this up you can create a boolean expression, and pass it to the `SetComputedRequired` method, as follows.

```cs
// computed required attribute based on the value of the selected reason
Expression<Func<EnumProperty, bool>> xOtherReason = reason => reason.Value?.Id == ReasonEnum.Other;
/* highlight-next-line */
ReasonDetailsProperty.SetComputedRequired(xOtherReason, ReasonProperty);
```

:::note
You can always manually recalculate the computed `Required` by calling `await prop.UpdateComputedRequiredAsync()`.
:::

### Custom computed bindings

Xomega Framework provides a base class `ComputedBinding` that allows you to easily create bindings for any custom attributes by extending it and implementing the `Update` method. For example, a computed binding for the property's `AccessLevel` could look as follows.

```cs
/* highlight-next-line */
public class ComputedAccessLevelBinding : ComputedBinding
{
    public ComputedAccessLevelBinding(BaseProperty property, LambdaExpression expr, params object[] args)
        : base(property, expr, args)
    {
        if (property == null) throw new ArgumentException("Property cannot be null", nameof(property));
/* highlight-next-line */
        if (expr.ReturnType != typeof(AccessLevel))
            throw new Exception("Supplied expression should return AccessLevel.");
    }

/* highlight-start */
    public override void Update(DataRow row)
    {
        var computed = (AccessLevel)GetComputedValue(row);
        property.AccessLevel = computed;
    }
/* highlight-end */
}
```

With that, you can just construct a binding for your property using the desired expression and args, and it will keep its `AccessLevel` computed based on your expression.

:::caution
Make sure to call the `Dispose` method on your computed binding when you no longer need it, to remove any listeners and prevent possible memory leaks.
:::

## Property bindings

To allow binding of UI controls to data properties in some UI frameworks such as WPF or WebForms, Xomega Framework provides base classes `BaseBinding` and `BasePropertyBinding`, which implement a binding registration system for each control type, as well as some common functionality for all property bindings, such as listening to property changes.

:::note
Generally, you don't need to use these base classes, unless you need to create custom property bindings for your controls in any of those UI frameworks.
:::
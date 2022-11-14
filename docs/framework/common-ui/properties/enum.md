---
sidebar_position: 2
---

# Enum Properties

Enum properties are special data properties that use Xomega Framework [lookup data](../lookup) to look up their values and store them as a generic [`Header`](../lookup#headers) structure, as well as to provide a list of items that their value(s) can be selected from and validated against.

:::info
Enum properties can be bound to a variety of UI controls that support value selection, such as drop-down lists, combo boxes, list boxes, checkbox groups, type-ahead fields, or even more sophisticated controls such as pick lists, where you select multiple values by moving items from one list to another.
:::

The base class for all such properties is `EnumProperty`, which provides advanced functionality in terms of displaying and looking up the values, as well as filtering the lists, including when the selection list depends on the values of other properties, which is referred to as [*Cascading Selection*](#cascading-selection) in here.

Each `EnumProperty` has an associated [`LookupTable`](../lookup#lookup-table) that it uses to look up the values. In order to associate your property with a lookup table from a lookup cache, you need to set the `EnumType` and optionally [`CacheType`](../lookup#lookup-cache), if the cache is not global, as follows.

```cs
var enumProp = new EnumProperty(this, "status");
enumProp.EnumType = "status enum"; // lookup table type
enumProp.CacheType = LookupCache.User; // the default is LookupCache.Global
```

:::note
You can also [use a local cache](#local-cache) by setting the `LocalCacheLoader` instead. If you need to provide a custom lookup table, you can override the `GetLookupTableAsync` and `GetLookupTable` methods in your subclass.
:::

## Enum property value

The `EnumProperty` stores its value internally as a `Header` object, or as a list of headers if the property is [multi-valued](base#multi-valued-properties). If the value you set is not a header of the proper type, then it will convert it to a string and will use that string to look up the header in its lookup table.

By default, the look-up will be by the `Id`, but you can also make it [look up by any format](../lookup#looking-up-data) that uniquely identifies the value by setting the `KeyFormat` field. For example, if the headers in your lookup table store alternative unique abbreviations in their additional attribute named "*abbrev*", then you can use it for value lookup on your property as follows.

```cs
// look up values by unique abbreviation from the "abbrev" attribute
enumProp.KeyFormat = string.Format(Header.AttrPattern, "abbrev");
```

:::note
If the property fails to look up the value by that string, it will construct a new `Header` with that string as an `Id`, which will make that header [invalid](../lookup#invalid-headers). This allows you to always access the property values as headers, and use their IDs to access the real value.
:::

### Value display

The property values, as well as the headers in the items selection, are displayed as a string using their `Text` field by default. However, if you want to customize the way they are displayed as a string, then you can set the [`DisplayFormat`](../lookup#display-format) field on your enum property. For example, you can display your values with both the `Id` and `Text` separated with a dash, as illustrated below.

```cs
// show status values as "ID - Text", e.g. "N - New"
statusProp.DisplayFormat = $"{Header.FieldId} - {Header.FieldText}"
```

:::note
For displaying values in the [`EditString` format](base#value-formats), which is used when you type in your values, the `KeyFormat` will be used, which defaults to the `Id`, but can be customized, as we described above.
:::

### Transport value

The property converts its value(s) to the [`Transport` format](base#value-formats) when it needs to prepare them for being sent to the backend services. The base `EnumProperty` will use the `Id` of the `Header` as is, which means that the transport value(s) will be string-based.

For other typed values, Xomega Framework provides a number of [specialized enum properties](#typed-enum-properties) that help you convert the values to the proper type. For example, if you store your enumerated status as an integer in the database, then you can use the `EnumIntProperty`.

### Value validation

As we mentioned above, if the value you are setting cannot be found in the lookup table, the property will create and store an [invalid header](../lookup#invalid-headers) as its value. When you validate the property, it may report a validation error when the header is invalid.

To control how the value is validated, the `EnumProperty` allows you to set the `LookupValidation` field to one of the following values.

- `LookupValidationType.ActiveItem` - the value should be an active item of the enum.
- `LookupValidationType.AnyItem` - the value should be any item of the enum (default).
- `LookupValidationType.None` - the value is not validated against the lookup table.


## Value selection list

`EnumProperty` exposes a possible list of values to select from through its `AsyncItemsProvider` delegate, which is a function that returns the list of possible property items for the current property at any given time. This function accepts a `DataRow` when it's part of a data list object, as well as some user input to filter the items when the property is bound to a type-ahead UI control.

By default, the `AsyncItemsProvider` is initialized to the `GetItemsAsync` method that returns all active items of the property's lookup table, and uses any applied custom filters and/or cascading selection restrictions. The method will load the look-up table asynchronously if it's not loaded yet.

:::note
The property also provides a synchronous version `ItemsProvider`, which returns only the cached version of the associated lookup table, and doesn't try to load it, if it's not available.
:::

### Sort order

By default, the items returned for the selection list are ordered based on their display string, which is based on the configuration of the property's `DisplayFormat`. So, if you display the `Text` of each item, then those items will be ordered in alphabetical order based on their text. If you display the `Id` or a combination of the `Id` and text, then it will be sorted by the `Id` or by the specified format.

You can also provide a custom sort order by setting the `SortField` delegate of the property, which is a function that returns the value to use for sorting from each item header. For example, if you store the sort order of each item in a separate attribute, then you can specify the `SortField` function as follows.
```cs
enumProp.SortField = h => h["sort order"];
```

### Filtered list

`EnumProperty` filters the value selection list from the lookup table using its delegate `FilterFunc`, which by default is initialized to the property's method `IsAllowed`. This method filters out inactive headers unless the header is one of the current property values. When [cascading selection](#cascading-static-items) is set up, it also filters only the headers that match the current values of the cascading properties.

You can set a custom filtering function, which can also utilize the default behavior of the `IsAllowed` method, as follows.

```cs
myProp.FilterFunc = (hdr, row) => myProp.IsAllowed(hdr, row) && MyFilter(hdr, row);
```

### Type-ahead

When the `EnumProperty` is bound to a type-ahead field, the list of available selection items will be filtered further based on the user input. The property will use its `FilterTermFunc` delegate to filter the headers that match the user input, which by default is initialized to the property's `MatchesTerm` function.

 The `MatchesTerm` function checks if the input text matches the beginning of either the `DisplayString` or `EditString` formats of the header in a case-insensitive way. This is because the selected value shown in the text field will be in the `EditString` format (e.g. `Id`), while the values to select in the dropdown list will be in the `DisplayString` format (e.g. `Text` or "`Id` - `Text`").

:::tip
You can implement custom logic for matching the user input, such as matching any part of the string rather than just the beginning. You can do it by either overriding the `MatchesTerm` function in your subclass or by just setting the `FilterTermFunc` delegate to your custom function.
:::

:::caution
The `FilterTermFunc` just filters the list of the available items in the lookup table and **does not make any remote calls** to get those items based on the user input. If you need to query remote services based on the user input, then you should set a custom `AsyncItemsProvider` function.
:::

### Refreshing the list

If the list of selection items for your `EnumProperty` has changed, either due to changes in the filtering conditions or when the data in the lookup table has changed, you should [fire a property change event](base#firing-change-events) using the `PropertyChange.Items` change, to refresh the selection lists in the bound UI controls, as shown below.

```cs
// notify of selection list change synchronously
myProp.FirePropertyChange(new PropertyChangeEventArgs(PropertyChange.Items, null, null, row));

// notify of selection list change asynchronously
await myProp.FirePropertyChangeAsync(new PropertyChangeEventArgs(PropertyChange.Items, null, null, row));
```

## Cascading selection

During cascading selection, selecting some value(s) in one property restricts the list of possible values in another property, which in turn may restrict the list of values in other dependent properties. For example, selecting a *Car Make* would restrict the list of *Car Models* to the selected make, and selecting a model could further restrict a list of *Car Trims*.

`EnumProperty` provides support for the following two types of cascading selection:
- one where all selection data is cached as lookup tables, and restricting the lists happens on the client via a filter function;
- the one where the property needs to make a remote call to get a list of possible values based on the values of other properties and cache the result locally as a lookup table.

### Cascading by attributes

When headers of the lookup table for your `EnumProperty` have some data stored in their additional attributes, and you have other properties that contain values corresponding to those attributes, then you can make the list of your enum property filtered based on the values in those other properties.

To make the `EnumProperty` filter its list by the value of an attribute matching the value of another property, you need to call the `SetCascadingProperty` method and pass it the attribute name and the instance of the other property. You can do it for several combinations of attributes and other properties, as needed.

For example, if the headers in a list of car models have the car make and the body style in the "*make*" and "*style*" attributes respectively, then you can have the list of models automatically filtered by the selected make(s) and style(s) as follows.

```cs
// cascade models based on selected make
carModelProperty.SetCascadingProperty("make", carMakeProperty);

// cascade models based on selected body styles
carModelProperty.SetCascadingProperty("style", bodyStyleProperty);
```

This will automatically subscribe to any changes in the `carMakeProperty` and `bodyStyleProperty` properties and will refresh the list of car models using the `MatchesCascadingProperties` method as part of the `FilterFunc` delegate. It will also remove any currently selected model(s) that don't match the values of the cascading properties.

:::note
The `MatchesCascadingProperties` method can handle **both single and multiple values** in either the target property or in the attribute of each header. For multiple values, it will check if any of the selected values match any of the attribute values.
:::

#### Handling null values

You can control how to handle the `null` values in either the target property or in the additional attributes. To specify how to handle a `null` value in the target cascading property, you can set the `CascadingMatchNulls` flag to one of the following values.
- `true` - if the `null` cascading value matches only values with attributes set to `null`.
- `false` - if the `null` cascading value matches any value (default).

For example, if no car make is selected, then you can show either all car models (`false`) or no car model (`true`), requiring the user to select the car make first. The latter assumes that all car models have a non-null value in their "*make*" attribute.

Similarly, you can set the `NullsMatchAnyCascading` flag to control how to handle `null` values in the attributes, as follows.
- `true` - if the `null` attribute value matches any value of the cascading property.
- `false` - if the `null` attribute value matches only the `null` value of the cascading property (default).

For example, if some car models don't have a body style attribute, e.g. because it's unknown, then you can either always display them, regardless of which body style is selected (`true`), or display them only when no body style is selected (`false`). In the latter case, it may also display other models with a known body style, depending on how you configure the `CascadingMatchNulls` flag.

:::tip
If you set `CascadingMatchNulls = true` and `NullsMatchAnyCascading = false`, then the `bodyStyleProperty` with a `null` value will show only the car models with an unknown body style. In this case, you may want to consider displaying the `null` body style option as "Unknown" by setting the [`NullString`](base#null-values) field as follows.
```cs
bodyStyleProperty.NullString = "Unknown";
```
:::

### Locally cached items{#local-cache}

When the list of all possible items is too large or too dynamic, it may be impractical to cache the entire data set and then filter it on the client. To get the data set that is specific to the context of the current screen, it makes more sense to call a remote service with some parameters that are coming from the current context.

However, when using `EnumProperty` you'd still need to convert the resulting data set of available items to a `LookupTable` so that the property could use it to look up and validate the values. To do that you want to create a [parameterized local cache loader](../lookup#parameterized-loaders) that calls your remote service based on the current parameters.

When you have your local cache loader, the `EnumProperty` allows you to set it as the `LocalCacheLoader` and will use its cache to get the lookup table, as opposed to using the global cache when you set the property's `EnumType`.

:::note
You can always manually initialize the local cache with the context parameters, which will load the data, by calling the `SetParametersAsync` method on your cache loader, and then manually [refresh the list](#refreshing-the-list) for the property.
:::

If the values of the parameters are sourced from another property though, then for each parameter you can call the `SetCacheLoaderParameters` method on your `EnumProperty`, and pass it the parameter name and an instance of the property to get the value from. This will start listening for changes in that property and will refresh the list of values in response to any value changes. It will also clear any values that are invalid based on the new list.

For example, imagine that your *Order Details* screen has a product stored in the `productProperty` and a list of special offers for the selected product in the `specialOfferProperty`. Since we don't want to globally cache all special offers for all products, we'll create a local cache loader `ProductSpecialOfferLoader` that has a parameter "*productId*", which it uses to call the remote service for getting the product's special offers.

Then all you have to do is to set your cache loader to the `LocalCacheLoader` of the `specialOfferProperty` and call `SetCacheLoaderParameters` to tell the property to source the value of the "*productId*" parameter from the `productProperty`, as follows.

```cs
// initialize the local cache loader for product special offers
specialOfferProperty.LocalCacheLoader = new ProductSpecialOfferLoader(serviceProvider);

// source the productId parameter from the value of productProperty
specialOfferProperty.SetCacheLoaderParameters("productId", productProperty);
```

Now whenever you select a new product, the `specialOfferProperty` will automatically call the cache loader with the new product Id and will refresh the list of available special offers. It will also clear any previously selected special offers that are no longer valid.

## Typed enum properties

When you need to persist the data in your property or send it over to remote services, the `EnumProperty` will convert its value(s) to the [Transport format](base#value-formats), which is the IDs of the headers that it stores internally. Since headers have their IDs as strings, the value sent to the services will be string-based by default.

If your persisted value has a different type, such as a number or a GUID, then you should use one of the following specialized enum properties that Xomega Framework provides, or create a custom subclass, if they don't cover your requirements.

### Integer-based enums

If the underlying data type of your enum values is `int`, `long`, `short` or `byte`, then you should use the `EnumIntProperty`, `EnumLongProperty`, `EnumShortProperty` and `EnumByteProperty` respectively.

For multi-valued properties, the transport value will be of type `List<T>`, e.g. `List<int>`.

:::caution
These enum properties assume that the values in their lookup tables have IDs of the proper type.

If the header's `Id` cannot be parsed as the correct type, the transport value will be `null`, or not included in the list when it's multi-valued, which may cause unwanted side effects.
:::

### EnumBoolProperty

Sometimes when your services return the value for your data property as a `bool`, you want to show and edit it as a list of two values, such as *Yes / No*. In this case, you can create a simple static lookup table with two values, and use it with an `EnumBoolProperty` for your property.

You can use your own text for the headers in that lookup table, but their IDs should match one of the following values.
- `Id` for the `true` value should be one of the strings in the [`BooleanProperty.TrueStrings`](standard#booleanproperty), e.g. "*true*", "*1*" or "*yes*".
- `Id` for the `false` value should be one of the strings in the [`BooleanProperty.FalseStrings`](standard#booleanproperty), e.g. "*false*", "*0*" or "*no*".

### EnumGuidProperty

If the underlying data type of your enum values is `Guid`, then you should use the `EnumGuidProperty`. For multi-valued properties, the transport value will be of type `List<Guid>`.

:::caution
`EnumGuidProperty` assumes that the IDs of the values in its lookup tables can be parsed as a `Guid`.

If the header's `Id` cannot be parsed as a `Guid`, the transport value will be `null`, or not included in the list when it's multi-valued, which may cause unwanted side effects.
:::

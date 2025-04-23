---
sidebar_position: 5
---

# Data List Objects

`DataListObject` is a special type of [data object](data-objects), where its data is stored as an **observable collection of rows**, instead of being stored directly within each of its data properties. A data list object represents a data table that is typically bound to a data grid UI component.

Each data property of a data list object can be viewed as a column in that data table, which is responsible for converting, formatting and validating values, maintaining metadata, such as the label, editability and visibility, as well as for any other functions for handling the data in that column.

You should [construct and register](data-objects#construction-and-registration) data list objects just like the regular data objects, and implement the `Initialize` method to [add data properties](data-objects#data-properties-initialization) and [initialize any actions](data-objects#action-properties-initialization). Unlike regular data objects though, data lists usually **don't have child objects**, but they can be added as a child to another parent data object.

## Row collection

The collection of rows in a data list object is stored as a special observable collection of `DataRow` classes. You can get a read-only observable collection of rows as an `IList` by calling the `GetData()` method, and also get the number of rows and columns in the data list via the `RowCount` and `ColumnCount` properties respectively, as shown below.

```cs
// highlight-next-line
IList<DataRow> rowData = dataListObject.GetData(); // get a readonly observable collection of rows
int rowCount = dataListObject.RowCount; // get the count of rows w/o creating a readonly row collection
int columnCount = dataListObject.ColumnCount; // get the count of columns based on the number of properties
```

The `DataRow` class that is used for storing rows in a data list object contains the actual data for the row, as well as a [selection indicator](#row-selection) and metadata by column, which specifies if the value in each particular column is [editable](#row-level-editing), [modified](#modification-tracking), [valid](#validating-row-values), etc.

### Accessing row values

`DataRow` does not allow you to get the row's values directly. Instead, you should use the `GetValue` methods on the corresponding data properties of your data list object, and pass your data row as an argument, in addition to the desired [value format](properties/base#value-formats). This allows reusing the [value conversion](properties/base#value-conversion) logic encapsulated in your data properties for both regular data objects and data list objects.

The following example illustrates how to get both typed and untyped values of a row in a `salesOrderList` object using various methods and formats, including static utility methods on the `DataRow` class.

```cs
SalesOrderListObject salesOrderList = ServiceProvider.GetService<SalesOrderListObject>();
await salesOrderList.ReadAsync(null); // populate data
DataRow firstRow = salesOrderList.GetData()[0];

// get internal value as an object
// highlight-start
object salesOrderId = salesOrderList.SalesOrderIdProperty.GetValue(ValueFormat.Internal, firstRow);
salesOrderId = DataRow.GetValue(firstRow, "SalesOrderId"); // same, using a property name
// highlight-end

// get a string value converted to a display string format
// highlight-start
string statusString = salesOrderList.StatusProperty.GetStringValue(ValueFormat.DisplayString, firstRow);
statusString = DataRow.GetString(firstRow, SalesOrderListObject.Status); // using a constant property name
// highlight-end

// using the typed method on generic data properties to get internal value as an integer
// highlight-next-line
int salesOrderIdInt = salesOrderList.SalesOrderIdProperty.GetValue(firstRow);
```

:::tip
If you only have a reference to a data row, you can always get its parent data list object using the `List` property. Then, to get the row values, you can access the data list properties either directly (by casting it to a concrete class), or [by the property name](data-objects#data-properties-initialization). Alternatively, you can use `DataRow`'s static utility methods to access values by the property name, as shown above.
:::

In addition, `DataRow` class extends `DynamicObject`, and implements getting internal values using the property name as follows.

```cs
dynamic dynamicRow = firstRow;
// highlight-next-line
object salesOrderId = dynamicRow.SalesOrderId; // get value from a dynamic property by name
```

### Updating row values

Similar to accessing row values, you have to use the data property's `SetValueAsync` method to update the value of that property in a specific `DataRow` by passing the row as an extra argument, as follows.

```cs
SalesOrderListObject salesOrderList = ServiceProvider.GetService<SalesOrderListObject>();
DataRow row = new DataRow(salesOrderList);

// highlight-next-line
await salesOrderList.SalesOrderIdProperty.SetValueAsync(1, row);
```

This will use the data property's value conversion logic to convert it to the proper internal format or data type, and possibly look it up in the associated [lookup table](lookup#lookup-table).

:::warning
While data properties also have a synchronous method `SetValue`, it is important to **set the value with the async method** and await the result, since [enum properties](properties/enum) may need to initialize their lookup table using a remote call during the conversion. For the same reason, you should avoid setting row values via the `DynamicObject` interface, as it would be synchronous.
:::

When you set the value of a data property for a specific row like that, it will fire a [property change event](properties/base#property-change-events) and will include that row in the event arguments, which you can access via the `Row` field. This allows the listeners to get or set values of other properties in the same row, such as when using [computed values](properties/base#computed-value) in a data list object.

#### Computed values in lists

The computed value expression that you define for your property should have an extra parameter of type `DataRow` at the end, which you should use to get other values from the same row, in order to compute your value. For example, if you have a child list of line items for a sales order, you can set the computed *LineTotal* using the values of *Price*, *Discount* and *Quantity* from the same row, as follows.

```cs title="LineItemListObject.cs"
Expression<Func<LineItemListObject, DataRow, decimal>> xLineTotal = (lst, row) => GetLineTotal(
// highlight-start
    lst.UnitPriceProperty.GetValue(ValueFormat.Internal, row),
    lst.PriceDiscountProperty.GetValue(ValueFormat.Internal, row),
    lst.OrderQuantityProperty.GetValue(ValueFormat.Internal, row)
// highlight-end
);
LineTotalProperty.SetComputedValue(xLineTotal, this);
```

#### Copying data from rows

Another option to set the data row's values is to copy them from another `DataRow` by calling the `CopyFromAsync` method on the `DataRow`, or the `UpdateRow` method on the `DataListObject`.

A typical use case for this is when you need to provide row-level editing in your data grid, and the user can either cancel the edits or update the entire row. To support this, you want to copy the current row into a new row for editing, and then copy the edited values back to the original row, if they pass validation and the user doesn't cancel.

`DataListObject` even provides a special member `EditRow` for these purposes, so copying the rows would look as follows.

```cs
async Task StartEditing()
{
    DataRow selectedRow = listObject.SelectedRows[0];
    // create an EditRow, and initialize it from the currently selected row
    listObject.EditRow = new DataRow(selectedRow);
    // highlight-next-line
    await listObject.EditRow.CopyFromAsync(selectedRow);
}

async Task FinishEditing()
{
    // update the original row from the current EditRow
// highlight-next-line
    await listObject.UpdateRow(listObject.EditRow.OriginalRow, listObject.EditRow);
    listObject.EditRow = null;
}
```

:::warning
While `DataRow` also provides a synchronous version of this method `CopyFrom`, you still want to **stick with the async version**.
:::

### Adding/removing rows

In addition to the async method `UpdateRow` above that replaces a row, `DataListObject` provides async methods `InsertAsync` and `RemoveRows` to insert a row at the specified index or to remove the specified data rows, as illustrated below.

```cs
DataRow newRow = new DataRow(dataListObject);
// highlight-start
await dataListObject.InsertAsync(0, newRow, false); // pass true to suppress notifications
await dataListObject.RemoveRows(new[] { newRow }, false); // pass true to suppress notifications
// highlight-end
```

:::tip
If you need to call a service operation when inserting or deleting a row to persist the change to the database, then you can override these methods, and call the operation there.
:::

`DataListObject` also has synchronous methods `Insert` and `RemoveAt` to insert or remove a row at the specified index. To remove all rows you can also call the `Clear` method. You can use these methods for local modification of the data list, but they are not suitable for calling service operations.

#### Collection events

`DataListObject` exposes an event `AsyncCollectionChanged` for notifying async listeners when the collection of rows is changed. This event is invoked by calling `OnCollectionChangedAsync` method, which is called by the `FromOutputAsync` and other async methods that modify the collection. If you manually modify the collection in an async method, you should call this method to notify the listeners.

`DataListObject` also implements the `INotifyCollectionChanged`, which means that you can subscribe to its synchronous `CollectionChanged` event, and get notified of the updates to its row collection. You can also manually trigger a collection changed event by calling the `FireCollectionChange` method to notify the listeners, such as the bound data grid.

If any listener code needs to know if a collection change event is currently in progress, they can check the data list object's `CollectionChangeFiring` flag.

Some methods, such as `InsertAsync` and `RemoveRows` allow you to suppress the collection notification, to prevent other listeners from interfering with the caller's logic. In this case, they can manually call the `OnCollectionChangedAsync` or `FireCollectionChange` later, as needed.

### Modification tracking

[Updating values](#updating-row-values) in a `DataRow` will mark the corresponding properties in the row as modified. You can check if anything in the row is modified using the `IsModified` method. Or you can check if a specific data property is modified in the given row using the `GetModified` method, as follows.

```cs
DataRow row = dataListObject.GetData()[0];

// check if any value in the row is modified
// highlight-next-line
bool? modified = row.IsModified();

// check if MyProperty value is modified in the row
// highlight-next-line
modified = dataListObject.MyProperty.GetModified(row);
```

If you remove any rows though, the `DataListObject` itself will be marked as modified, such that its `IsModified` method or `Modified` property returns `true`.

You can also call the standard `SetModified` method to set the modification state on the data list, or also on all its rows when you pass the `recursive` argument as `true`. This will also trigger the standard `INotifyPropertyChanged` event for the `Modified` property.

:::tip
As with regular data objects, you can disable modification tracking on a data list object by setting its `TrackModifications` flag.
:::

### Row-level editing

To find out if a data property of a data list object is editable for a specific row, you can call the `GetEditable(row)` method on that property for the specified row. By default, it would return the `Editable` state of the entire property (column), which is also based on the editability of its parent data object.

However, even if a property is editable, you can make it not editable for a specific row by calling the `SetEditable` method for that row, as follows.

```cs
DataRow row = myListObject.GetData()[0];
/* highlight-next-line */
myListObject.MyDataProperty.SetEditable(false, row);
```

This may fire a [property change event](properties/base#property-change-events) for `PropertyChange.Editable` for that row. You can always manually reset it back to `true`, as needed. Alternatively, you can set up [computed editability](properties/base#computed-editability) for that property on a row level by adding a `DataRow` to your expression, as illustrated below.

```cs
// make discount editable only for products that are on sale
Expression<Func<LineItemListObject, DataRow, bool>> xDiscountEditable = (lst, row) => 
// highlight-next-line
    IsOnSale(lst.ProductProperty.GetValue(ValueFormat.Internal, row));
DiscountProperty.SetComputedEditable(xDiscountEditable, this);
```

:::note
In a similar manner, you can get or set a row-level `Editing` flag for a property by calling the `GetEditing(row)` or `SetEditing(value, row)` methods respectively. The latter will also fire a corresponding property change event for that row, which allows you to run certain logic, such as validating the value when the user stops editing it.
:::

### Validating row values

When your data list object is bound to an editable data grid with row-level editing, each value that you edit in the row will be automatically validated when the user stops editing it, i.e. the `Editing` flag gets set to `false`. Any validation errors for that property will be stored in that row. You can also manually trigger validation of that property for that row, and then retrieve the validation errors, as follows.

```cs
myProperty.Validate(row); // manually validate the row's value of myProperty
ErrorList errors = myProperty.GetValidationErrors(row); // get row's validation errors for myProperty
```

The bound editable data grid would perform such validations, and prevent updating the row, if there are any validation errors. You can also reset validation errors for each row by calling the method `ResetAllValidation` on your data list object.

:::warning
Nevertheless, calling `Validate` on the `DataListObject` would not automatically validate its rows, in order to avoid performance issues with non-editable list objects. Nor does the `GetValidationErrors` method return row validation errors by default. However, you can always override those methods in your specific data list to validate each row and return all row errors as needed.
:::

The functions for validating values in data rows are the same as for [validating regular data property values](properties/base#property-validation), since they accept a `row` as the last argument, and must pass it to the `AddValidationError` method of the data property, as shown below.

```cs
/* highlight-next-line */
public static void ValidateDecimal(DataProperty dp, object value, DataRow row)
{
    if (dp != null && !dp.IsValueNull(value, ValueFormat.Internal) && !(value is decimal))
/* highlight-next-line */
        dp.AddValidationError(row, Messages.Validation_DecimalFormat, dp.Label);
}
```

### Row-specific enums

When you have an [`EnumProperty`](properties/enum) in an editable data list object, the cell editor for that property would provide a selection from a list of possible values associated with that property, which typically comes from a [`LookupTable`](lookup#lookup-table). When that selection list is the same for all rows, and the lookup table comes from a static global cache, then this works the same as in regular data objects.

However, sometimes you may need to display different selection lists in each row based on other values in the same row. In this case, you can set up [cascading selection](properties/enum#cascading-selection) from other properties in the data list object the same way as you do for regular objects. As described in the above link, you can do it in one of the following two ways.
1. Set up [cascading client-side filtering](properties/enum#cascading-by-attributes) of a globally cached static lookup table by a specific attribute using `SetCascadingProperty`.
1. If the complete list is too large to be cached on the client side, you can [set up a `LocalCacheLoader`](properties/enum#local-cache) for the property, and call the `SetCacheLoaderParameters` to provide values from other data properties in the same row. The local cache loader will then populate a local cache from a remote service and will store it in the current data row for that property.

## Criteria object

When a data list object is a primary object on your view, rather than a child list, you typically want to provide some filter criteria for the service operation, so that you don't retrieve the entire list, but only the relevant records. Such criteria are also usually specified by the users on the screen, and validated before running the search and retrieving the results.

To hold the values for the search criteria, `DataListObject` has a special member `CriteriaObject`, which you can set to your custom data object, as shown below, and then bind its data properties to the fields on your search criteria panel.

```cs
salesOrderList.CriteriaObject = ServiceProvider.GetService<SalesOrderCriteria>();
```

The custom data object needs to inherit from the `CriteriaObject` base class and initialized slightly differently than regular data objects. For each field to filter by, you need to add a `CriteriaPropertyGroup` with data properties for the actual filter value(s) and an [`OperatorProperty`](properties/specialty#operatorproperty), as needed. The following snippet illustrates this configuration.

```cs
// highlight-next-line
public class SalesOrderCriteria : CriteriaObject
{
    public const string OrderDate = "OrderDate";
    ...
    protected override void Initialize()
    {
        // add criteria property group by order date with operator and two value properties for the range
/* highlight-next-line */
        AddCriteriaPropertyGroup(new CriteriaPropertyGroup
        {
            FieldName = OrderDate,
            ValueProperty = new DateProperty(this, OrderDate),
            Value2Property = new DateProperty(this, OrderDate + V2),
            OperatorProperty = new OperatorProperty(this, OrderDate + Operator)
            {
                EnumType = "operators",
            }
        });
    }
}
```

:::note
Using `CriteriaPropertyGroup` will help you to convert the criteria values to `FieldCriteria` properties of the [criteria DTO](../services/querying#criteria-dto) for  service calls, as well as to add and edit criteria fields dynamically.
:::

### Editing criteria statically

To allow the user to edit criteria values statically, you can add all the appropriate UI controls to your search criteria panel, and bind them to the properties of your `CriteriaObject`. To get individual properties of the criteria object, you can either access them through the corresponding `CriteriaPropertyGroup`, or directly by their names, as shown below.

```cs
CriteriaObject critObj = salesOrderList.CriteriaObject;

// getting criteria properties via the property group
/* highlight-next-line */
CriteriaPropertyGroup orderDateGrp = critObj.CriteriaFieldGroups[SalesOrderCriteria.OrderDate];
DataProperty orderDate = orderDateGrp.ValueProperty;
DataProperty orderDate2 = orderDateGrp.Value2Property;
DataProperty orderDateOperator = orderDateGrp.OperatorProperty;

// getting criteria properties directly by their names
orderDate = critObj[SalesOrderCriteria.OrderDate];
orderDate2 = critObj[SalesOrderCriteria.OrderDate + CriteriaObject.V2];
orderDateOperator = critObj[SalesOrderCriteria.OrderDate + CriteriaObject.Operator];
```

Editing criteria statically on the search criteria panel may work well when the number of criteria fields is relatively small.

However, if you want to allow flexible searches by a large number of filter criteria, showing them all statically on the criteria panel will make it too busy and less user-friendly. It's going to take up more screen real estate, the users may have difficulties finding the fields they need, and it may be harder to see which criteria actually have values.

### Editing criteria dynamically

To help the users work with large criteria objects, the `CriteriaObject` provides support for editing criteria fields dynamically.

First of all, it defines a special data property `FieldSelectorProperty`, which has criteria field groups of the current criteria object as the list of possible values. You can bind this properly to a drop down list or a combo box, and allow the user to select the criteria field they want to add or edit.

When the value of the `FieldSelectorProperty` changes, it will construct a new `CriteriaEditObject` from the current values of the selected criteria group, and will set it as the `FieldEditObject` property of the `CriteriaObject`. You can bind this edit object to a separate panel for editing the values for the currently selected criteria group.

:::warning
You need to be able to dynamically construct UI controls of appropriate types for the selected criteria group, and bind them to the properties of the `CriteriaEditObject`.
:::

That separate edit panel can have the `Cancel`, `Reset` and `Add/Update` buttons bound to the `CancelAction`, `ResetAction` and `AddAction` of the `CriteriaEditObject`, which are calling the `CancelEditAsync`, `ResetEditAsync` and `ApplyEditAsync` methods of the `CriteriaObject` respectively.

When applying the edits, the `CriteriaEditObject` will validate the values and will store any errors in its `Errors` property, which you can use to display validation errors in the same panel. For example, when both `ValueProperty` and `Value2Property` are set for the `Between` operator, it will validate that the first value is not greater than the second one.

:::tip
To implement custom validation logic, you can override the `CreateEditObject` method in your `CriteriaObject`, and return a subclass of the `CriteriaEditObject` with any customizations as needed.
:::

### Displaying selected criteria

When the users edit criteria fields dynamically using the separate edit panel, they need to be able to see the criteria fields that they have already added, and the values that they have set for them.

To support this, the `CriteriaObject` provides a method `GetCriteriaDisplays` that returns a list of `FieldCriteriaDisplay` objects, which contain the field name and label, operator and the field criteria values that are formatted for display.

You can use this method to display a list of selected criteria fields along with their operators and values. Each field can also provide additional actions to edit or clear its values by calling either the `EditCriteria` or `ResetCriteria` methods on the `CriteriaObject` for that field.

### Mixing static and dynamic

For user convenience, you can also show some criteria fields statically, such as the most commonly used ones, and the rest ones dynamically. To do this, you need to override the property `StaticFields` in your `CriteriaObject`, and return the names of the properties that you want to show statically, as shown below.

```cs
public class SalesOrderCriteria : CriteriaObject
{
/* highlight-next-line */
    public override string[] StaticFields => new string[] { OrderDate };
}
```

This will ensure that the `FieldSelectorProperty` will not include the static fields in the list of possible values. To make sure that static fields that have values are not also displayed with the dynamic fields that have values, you need to call `GetCriteriaDisplays(true)` when [displaying the selected criteria](#displaying-selected-criteria) fields. 

## Populating data

Populating data list objects by reading the data from a service operation is typically done by implementing the `DoReadAsync` method, and may depend on the type of criteria or parameters that the operation takes. The `DoReadAsync` method accepts an `options` parameter, which is of type `DataListObject.ReadOptions`, and can be used to pass the context of the read operation, such as the following flags.
- `PreserveSelection` - if set to `true`, the current row [selection is preserved](#preserving-selection) after the read, if possible.
- `IsReload` - if set to `true`, the read operation is a reload of the data and should use the currently [applied criteria](#applied-criteria).
- `IsPaging` - if set to `true`, the read operation is a paging operation when [server-side paging](#sorting-and-paging) is used.
- `IsSorting` - if set to `true`, the read operation is a sorting operation when [server-side paging](#sorting-and-paging) is used.

### Reading with criteria

When the service operation to read the data for your list object takes a [criteria DTO](../services/querying#criteria-dto) as an input parameter, you should construct it by calling the `GetCriteriaDataContract` method, and pass it to the service call. Then you should populate the data list object from the output by calling the `FromOutputAsync` method, as shown below.

```cs
protected override async Task<ErrorList> DoReadAsync(object options, CancellationToken token = default)
{
// highlight-next-line
    SalesOrderCriteriaDTO criteria = GetCriteriaDataContract<SalesOrderCriteriaDTO>(options);
    using (var s = ServiceProvider.CreateScope())
    {
        var salesOrderService = s.ServiceProvider.GetService<ISalesOrderService>();
/* highlight-start */
        var output = await salesOrderService.ReadListAsync(criteria, token);
        await FromOutputAsync(output, options, token);
/* highlight-end */
        return output.Messages;
    }
}
```

If you're calling the read operation as a result of a new search, rather than a reload or a page request, then `GetCriteriaDataContract` will construct a new criteria DTO from the current values of the `CriteriaObject`, which would be validated before this call. In this case, it will also set the [current page](#paging) to 1, so that any new search will always start from the first page.

If applicable, the `FromOutputAsync` method will also set the `TotalRowCount` property of the data list object to the [`TotalCount`](../services/querying#returning-total-count) value of the `Output` object, which is the total number of records that match the criteria.

### Applied criteria

Once a new search successfully runs and the data list object is populated with the results, the list object will call `GetCriteriaDisplays(false)` to get all populated criteria values and operators of the `CriteriaObject` in the display format, and will store them in the `AppliedCriteria` property as a list of  `FieldCriteriaDisplay` structures.

You can use the `AppliedCriteria` to display a summary of the applied criteria on the screen, and refresh it whenever it changes, as changing it will fire the regular `INotifyPropertyChanged` event.

Separately, the data list object will store the criteria DTO that was used in the service call in another property `AppliedCriteriaValues`. If, later on, you try to reload the data or request a new page during server-side paging, the `GetCriteriaDataContract` method will use the value from this property to return the criteria DTO for the service call, rather than constructing a new one from the `CriteriaObject`.

This will avoid subtle issues when the user might change the current criteria without applying them, and then try to reload the data or request a new page.

### Client filtering

If your data grid bound to your data list object needs to perform additional filtering on the client side by one or more columns, then `DataListObject` provides a handy utility method `PropertyValueMatches`, which checks if the value of a specified data property in a given row matches the specified criteria value using the supplied [operator](../services/querying#operators).

:::tip
You may need to translate the data grid's client-side filter criteria to a number of operator/value clauses, and combine the results of the calls to `PropertyValueMatches` for each clause, to determine whether each row matches those filter criteria.
:::

### Reading child lists

When your data list object is a child of a parent data object, and the `Read` service operation for the parent object also returns the data for your data list as a nested collection, then your child list object will be automatically populated whenever you call `ReadAsync` on the parent object, provided that the names of the properties in the nested collection match the names of the list object's properties.

Otherwise, if you need to populate the data in your data list object using a separate service call, then you can override the `DoReadAsync` method, call the service in there, and populate the list from the result using the `FromOutputAsync` method. For example, reading and populating a list of line items on a sales order object from a service call would look as follows.

```cs title="LineItemListObject.cs"
protected override async Task<ErrorList> DoReadAsync(object options, CancellationToken token = default)
{
    using (var s = ServiceProvider.CreateScope())
    {
        var salesOrderId = (int)(Parent as SalesOrderObject).SalesOrderIdProperty.TransportValue;
        var salesOrderService = s.ServiceProvider.GetService<ISalesOrderService>();

// highlight-start
        var output = await salesOrderService.ReadLineItemsAsync(salesOrderId, token);
        await FromOutputAsync(output, options, token);
// highlight-end
        return output.Messages;
    }
}
```

:::note
You can also pass the `FromOutputAsync` method a `ReadOptions` parameter configured with the context of this call, such as whether to [preserve the current row selection](#preserving-selection).
:::

### Row DTO conversion

If your data properties don't fully line up with the properties of the returned DTOs, then you can override the `FromDataContractAsync` method, construct a `List<DataRow>` manually, and pass it to the `data.ReplaceData()` method.

In order to populate each row from the corresponding item in your DTO, you can leverage the version of the `FromDataContractAsync` method that takes a row argument, and then set the values of any custom properties, as follows.

```cs
public override async Task FromDataContractAsync(object dataContract, object options,
                                                 CancellationToken token = default)
{
    IList<DataRow> rows = new List<DataRow>();
    foreach (RowDTO rowDTO in (IEnumerable<RowDTO>)dataContract)
    {
        DataRow row = new DataRow(this);
        rows.Add(row);
// highlight-next-line
        await FromDataContractAsync(rowDTO, options, row, token);
        // set custom properties
// highlight-next-line
        await MyProperty.SetValueAsync(rowDTO.CustomValue, row, token);
    }
    rows.Sort();
    data.ReplaceData(rows);
    SetAppliedCriteria(options);
}
```

:::note
In your overridden `FromDataContractAsync` method, you may also need to [restore the selection](#preserving-selection), set your list object as not modified, and perform other actions as needed.
:::

Similarly, when you need to send the entire list to a service operation, you can convert the data from your data list object to a DTO using the standard [`ToDataContract`](data-objects#conversion-to-dtos) method, provided that the property names in your list object and DTO match up. Otherwise, you can override it and populate the DTO list manually, leveraging the `ToDataContractProperties` method for each data row.

### Resetting data

To reset the data in your data list object, as well as the [applied criteria](#applied-criteria), you can call the `ResetDataAsync` method. If you also want to clear the values in the `CriteriaObject`, then you should call `ResetDataAsync` on that object too, as follows.

```cs
await myListObject.ResetDataAsync();
await myListObject.CriteriaObject.ResetDataAsync();
```

:::note
This is what the *Reset* action usually does on the standard Xomega Framework search forms.
:::

## Sorting and paging

`DataListObject` allows you to create and set sort criteria by certain data properties, and then sort the rows of the data list locally using these criteria and/or send this criteria to the service operation that populates the list object's data, so that the data is sorted on the server side. You can also sort the list data locally without storing the applied sort criteria, or sort it using a custom comparison function.

### Sort criteria

Xomega Framework provides a class `ListSortCriteria`, which is an *ordered* list of `ListSortField` objects. Each of those defines a sort order by a specific data property in the list object, as well as the sort direction.

:::note
The `ListSortField` class is very similar to the `SortField` class that is used for [passing sort criteria to the service operations](../services/querying#server-side-sorting), but it's designed specifically for data list objects. `ListSortCriteria` class has a method `ToSortFields` to convert it to an array of `SortField` structures.
:::

Normally, the `ListSortCriteria` object is created and set by the bound data grid when you click on the headers of its columns. You can also create it manually in your code and apply it to your data list object by calling the `SetSortCriteria` method, as shown below.

```cs
var sortField = new ListSortField()
{
    PropertyName = "MyProperty",
    SortDirection = ListSortDirection.Ascending
};
var sortCriteria = new ListSortCriteria() { sortField };
// highlight-next-line
await myListObject.SetSortCriteria(sortCriteria);
```

### Client-side sorting

If the [`PagingMode`](#paging-mode) property of your data list object is not set to `Paging.Server`, then calling the `SetSortCriteria` method will sort the data locally with the specified sort criteria using the `Sort` method on the data list object. Sorting on the client side is performed as follows.

If the internal values of your sort properties at each row implement `IComparable`, then it will use that interface for comparing the values. This allows you to compare typed properties, such as numeric or date/time, using the underlying data type. In all other cases, it will compare the values converted to the `DisplayString` format, which is how the user sees them on the screen. Null values will be sorted first in ascending order, and last in descending order.

:::note
[Populating the data list object](#populating-data) from the service operation will also sort it locally using the currently applied sort criteria, if any.
:::

#### Custom client sorting

If you want to sort a data list object using temporary sort criteria, without storing it in the `SortCriteria` property, then you can do it by calling the `Sort` method of the `DataListObject`, and passing it the `Compare` function from that temporary `ListSortCriteria` object, as shown below.

```cs
var sortCriteria = new ListSortCriteria() { ... };
// highlight-next-line
myListObject.Sort(sortCriteria.Compare);
```

For the maximum flexibility, you can also pass any custom row comparison function to the `Sort` method, as follows.

```cs
Comparison<DataRow> compareRows = (r1, r2) => CompareRows(r1, r2); // custom comparison function
myListObject.Sort(compareRows);
```

:::warning
Sorting the list data using a custom comparison function that is different from the `SortCriteria` property may be misleading, if the data list object is bound to a data grid that displays the applied sort criteria using the `SortCriteria` property.
:::

### Server-side sorting

When reading data for a primary data list object from a service operation [with criteria](#reading-with-criteria) that supports [server-side sorting](../services/querying#server-side-sorting), the `GetCriteriaDataContract` method will automatically convert the currently applied sort criteria to the `SortField` array, and set it to the `Sort` property of the `SearchCriteria` DTO, in order to pass it to the service operation.

This way, the service will return the data sorted by the specified sort criteria, which is essential when the results from the service are limited either by the maximum number of records or by the paging parameters, since you cannot reliably sort the data on the client side in this case.

Also, if the [`PagingMode`](#paging-mode) property of your data list object is set to `Paging.Server`, then calling the `SetSortCriteria` method with new sort criteria will store the provided criteria in the `SortCriteria` property, and will call the `ReadAsync` method to automatically reload the data from the service with the new sort criteria.

### Paging

`DataListObject` supports paging of the data in the list by allowing to keep track of the `CurrentPage` and `PageSize` properties. These properties are defined as read-only, but you can set them by calling the async methods `SetCurrentPage` and `SetPageSize` respectively.

:::note
Internally, the `DataListObject` stores the `firstRowIndex` for the `CurrentPage` to allow setting it via the `SkipTakeAsync` method by certain bound data grids.
:::

The data list also provides a `CurrentPageData` property, which returns a subset of the data for the current page if the `PagingMode` is set to `Paging.Client`, and all the list data otherwise.

Coupled with the `TotalRowCount` property, which is populated by the [`FromOutputAsync`](#reading-with-criteria) method using the [total counts returned by the service](../services/querying#returning-total-count), the above properties can be used to implement paging in the bound data grid.

#### Paging mode

`DataListObject` defines a `PagingMode` property using the `DataListObject.Paging` enum. Following are the possible values for this enum and their meanings.
- `Paging.Server` - the data list object is populated from the service operation that supports [server-side paging](../services/querying#server-side-paging) and contains only data for the current page. The `CurrentPage` and `PageSize` properties, as well as the currently applied sort criteria, are passed to the service operation to read the data for the current page. Changing the page, page size or sort criteria will automatically call the `ReadAsync` method to automatically reload the data from the service.
- `Paging.Client` - the data list object contains all the data (possibly [limited by the maximum number of rows](../services/querying#limiting-results) from the server), but the bound data grid can use the paging properties of the list object to implement paging on the client side. This is the default value.
- `Paging.None` - the data list object contains all the data, but the paging properties are not used. The bound data grid may display no paging controls in this case.

## Row selection

`DataListObject` supports tracking row selection by having a `Selected` property on the `DataRow` objects. You can control whether you can select multiple rows or just a single row by setting the `RowSelectionMode` property to one of the following strings.
- `DataListObject.SelectionModeSingle` - at most one row can be selected. Selecting any row will clear the previous selection.
- `DataListObject.SelectionModeMultiple` - multiple rows can be selected.

:::note
Any other value will not be handled by the `DataListObject`, but the bound data grid can interpret it in a custom way. For example, a blank value of the `RowSelectionMode` can mean that selection is not allowed, while other values may indicate a more detailed mode, such as contiguous selection only.
:::

The `DataListObject` allows you to get either selected rows or the indexes of the selected rows, as well as to check if the row is selected using an index, as illustrated below.

```cs
DataRow row = dataListObject.GetData()[0];

// check if given row is selected
bool selected = row.Selected; // check the row
selected = dataListObject.IsRowSelected(0); // check by index

// get selected rows
List<DataRow> selRows = dataListObject.SelectedRows;

// get indexes of selected rows
List<int> selIndexes = dataListObject.SelectedRowIndexes;
```

### Selecting rows

`DataListObject` provides several different ways to select (or deselect) a single row or multiple rows, depending on your `RowSelectionMode` setting, as demonstrated by the following examples.

```cs
IList<DataRow> rows = dataListObject.GetData();

// select the first row, and clear selection of any other row(s)
dataListObject.SelectRow(0);
dataListObject.SelectRow(rows[0]);

// select the second row, and clear any other row, if selection mode is single
dataListObject.SetRowSelected(rows[1], true);

// toggles selection of the current row. May clear other rows in single selection mode
dataListObject.ToggleSelection(rows[1]);

// select rows at indexes #2 through #4, and clear selection of any other rows
bool success = dataListObject.SelectRows(2, 4, true); // returns false, if selection mode is single
dataListObject.SelectedRows = new List<DataRow>() { rows[2], rows[3], rows[4] };

// add selection of row #5 to the current selection, if selection mode is multiple.
// otherwise, select row #5 and clear other selected rows
dataListObject.SelectRows(5, 5, false);

// select all rows, if selection mode is multiple
dataListObject.SelectAllRows();

// clear any row selection
dataListObject.ClearSelectedRows();
```

:::note
The bound data grid that allows selection would typically call some of these methods when the user makes a selection, in order to synchronize the grid selection with the data list object.
:::

### Selection events

Data list objects provide a standard `SelectionChanged` event, which allows you to listen for any changes in the row selection. The bound data grid may listen to the selection changes to highlight the selected rows.

This event allows you to write platform-independent UI logic based on the selection change. For example, upon selecting a row in a master data grid, you may trigger an update of the details object to read and show the details for the selected row.

:::tip
This event also enables using `SelectedRows` or `SelectedRowIndexes` in the expressions for [computed properties](properties/base#computed-properties), such as to set enabling conditions for certain actions when a row is selected (e.g. the [SelectAction](#select-action)), or to show a calculated summary for the selected rows.
:::

If you need to trigger the `SelectionChanged` manually, you can call the `FireSelectionChanged` with no arguments, as follows.

```cs
dataListObject.FireSelectionChanged();
```

### Preserving selection

When refreshing the data in a data list object from the backend, it is often desirable to preserve the currently selected row, if it still exists in the new dataset. To support this, the data list object's `FromDataContractAsync` method handles options passed as `ReadOptions` with a `PreserveSelection` parameter set. You would typically pass it through the `ReadAsync` method as follows.

```cs
// highlight-next-line
var options = new DataListObject.ReadOptions { PreserveSelection = true };
var errors = await dataListObject.ReadAsync(options, token);
```

In order to allow the `DataListObject` to find the currently selected row in the new data set, one or more of its data properties should have the `IsKey` flag set to `true`, as follows.

```cs
public partial class SalesOrderList : DataListObject
{
    protected override void Initialize()
    {
        SalesOrderIdProperty = new IntegerKeyProperty(this, SalesOrderId)
        {
            Editable = false,
// highlight-next-line
            IsKey = true
        };
        ...
    }
}
```

By default, the `DataListObject` will use the same comparison mechanism for the key values, as is used by the [sort criteria](#sort-criteria) to find the selected rows in the new list.

:::tip
If that doesn't work for you, you can always override the method `SameEntity` on the `DataListObject` as needed.
:::

### Select action

For search views that are intended for searching some entities, and then selecting one or more of such entities, `DataListObject` defines a standard `SelectAction`, which is configured to be enabled only when one or more rows are selected, as follows.

```cs
// highlight-next-line
Expression<Func<DataListObject, bool>> xSel = lst => lst.SelectedRows.Any();
SelectAction.SetComputedEnabled(xSel, this);
```

This allows you to bind the `SelectAction` to a *Select* button on your search screen, and have it disabled when there is no selection.
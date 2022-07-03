---
sidebar_position: 4
---

# Data List Objects

`DataListObject` is a special type of [data object](data-objects), where its data is stored as an **observable collection of rows**, instead of being stored directly within each of its data properties. Data list object represents a data table that is typically bound to a data grid UI component.

Each data property of a data list object can be viewed as a column in that data table, which is responsible for converting, formatting and validating values, maintaining metadata, such as the label, editability and visibility, as well as for any other functions for handling the data in that column.

You should [construct and register](data-objects#construction-and-registration) data list objects just like the regular data objects, and implement the `Initialize` method to [add data properties](data-objects#data-properties-initialization) and [initialize any actions](data-objects#action-properties-initialization). Unlike regular data objects though, data lists usually **don't have child objects**, but they can be added as a child to another parent data object.

## Row collection

The collection of rows in a data list object is stored as a special observable collection of `DataRow` classes. You can get a readonly observable collection of rows as an `IList` by calling the `GetData()` method, and also get the number of rows and columns in the data list via the `RowCount` and `ColumnCount` properties respectively, as shown below.

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
If you only have a reference to a data row, you can always get its parent data list object using the `List` property. Then, to get the row values, you can access the data list properties either directly (by casting it to a concrete class), or [by the property name](data-objects#data-properties-initialization). Alternatively, you can use the `DataRow`'s static utility methods to access values by the property name, as shown above.
:::

In addition, `DataRow` class extends `DynamicObject`, and implements getting internal values using the property name as follows.

```cs
dynamic dynamicRow = firstRow;
// highlight-next-line
object salesOrderId = dynamicRow.SalesOrderId; // get value from a dynamic property by name
```

### Updating row values

Similar to accessing row values, you have to use data property's `SetValueAsync` method to update the value of that property in a specific `DataRow` by passing the row as an extra argument, as follows.

```cs
SalesOrderListObject salesOrderList = ServiceProvider.GetService<SalesOrderListObject>();
DataRow row = new DataRow(salesOrderList);

// highlight-next-line
await salesOrderList.SalesOrderIdProperty.SetValueAsync(1, row);
```

This will use the data property's value conversion logic to convert it to the proper internal format or data type, and possibly look it up in the associated [lookup table](lookup#lookup-table).

:::caution
While data properties also have a synchronous method `SetValue`, it is important to **set the value with the async method** and await on the result, since [enum properties](properties/enum) may need to initialize their lookup table using a remote call during the conversion. For the same reason, you should avoid setting row values via the `DynamicObject` interface, as it would be synchronous.
:::

When you set the value of a data property for a specific row like that, it will fire a [property change event](properties/base#property-change-events), and will include that row in the event arguments, which you can access via the `Row` field. This allows the listeners to get or set values of other properties in the same row, such as when using [computed values](properties/base#computed-value) in a data list object.

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

:::caution
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

`DataListObject` implements the `INotifyCollectionChanged`, which means that you can subscribe to its `CollectionChanged` event, and get notified of the updates to its row collection.

You can also manually trigger a collection changed event by calling the `FireCollectionChange` method to notify the listeners, such as the bound data grid. If any listener code needs to know if a collection change event is currently in progress, they can check the data list object's `CollectionChangeFiring` flag.

Some methods, such as `InsertAsync` and `RemoveRows` allow you to suppress the collection notification, to prevent other listeners from interfering with the caller's logic. In this case they can manually call the `FireCollectionChange` later, if desired.

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

:::caution
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

When you have an [`EnumProperty`](properties/enum) in an editable data list object, the cell editor for that property would provide selection from a list of possible values associated with that property, which typically comes from a [`LookupTable`](lookup#lookup-table). When that selection list is the same for all rows, and the lookup table comes from a static global cache, then this works the same as in regular data objects.

However, sometimes you may need to display different selection lists in each row based on other values in the same row. In this case, you can set up [cascading selection](properties/enum#cascading-selection) from other properties in the data list object the same way as you do for regular objects. As described in the above link, you can do it in one of the following two ways.
1. Set up [cascading client-side filtering](properties/enum#cascading-by-attributes) of a globally cached static lookup table by a specific attribute using `SetCascadingProperty`.
1. If the complete list is too large to be cached on the client side, you can [set up a `LocalCacheLoader`](properties/enum#local-cache) for the property, and call the `SetCacheLoaderParameters` to provide values from other data properties in the same row. The local cache loader will then populate a local cache from a remote service, and will store it in the current data row for that property.

## Populating data

When your data list object is a child of a parent data object, and the `Read` service operation for the parent object also returns the data for your data list as a nested collection, then your child list object will be automatically populated whenever you call `ReadAsync` on the parent object, provided that the names of the properties in the nested collection match the names of the list object's properties.

Otherwise, if you need to populate the data in your data list object using a separate service call, then you can override the `DoReadAsync` method, call the service in there, and populate the list from the result using the `FromDataContractAsync` method. For example, reading and populating a list of line items on a sales order object from a service call would look as follows.

```cs title="LineItemListObject.cs"
protected override async Task<ErrorList> DoReadAsync(object options, CancellationToken token = default)
{
    using (var s = ServiceProvider.CreateScope())
    {
        var salesOrderId = (int)(Parent as SalesOrderObject).SalesOrderIdProperty.TransportValue;
        var salesOrderService = s.ServiceProvider.GetService<ISalesOrderService>();

// highlight-start
        var output = await salesOrderService.ReadLineItemsAsync(salesOrderId, token);
        await FromDataContractAsync(output?.Result, options, token);
// highlight-end
        return output.Messages;
    }
}
```

:::note
You can also pass the `FromDataContractAsync` method a `CrudOptions` parameter configured to [preserve the current row selection](#preserving-selection), if desired.
:::

### DTO conversion

If your data properties don't fully line up with the properties of the returned DTOs, then you can override the `FromDataContractAsync` method, construct a `List<DataRow>` manually, and pass it to the `data.ReplaceData()` method.

In order to populate each row from the corresponding item in your DTO, you can leverage the version of the `FromDataContractAsync` method that takes a row argument, and then set the values of any custom properties, as follows.

```cs
public override void FromDataContract(object dataContract, object options)
{
    IList<DataRow> rows = new List<DataRow>();
    foreach (DTOItem dtoItem in (IEnumerable<DTOItem>)dto)
    {
        DataRow row = new DataRow(this);
        rows.Add(row);
// highlight-next-line
        await FromDataContractAsync(dtoItem, options, row, token);
        // set custom properties
// highlight-next-line
        await MyProperty.SetValueAsync(dtoItem.CustomValue, row, token);
    }
    data.ReplaceData(rows);
}
```

:::note
In your overridden `FromDataContractAsync` method, you may also need to [restore the selection](#preserving-selection), set your list object as not modified, and perform other actions as needed.
:::

Similarly, when you need to send the entire list to a service operation, you can convert the data from your data list object to a DTO using the standard [`ToDataContract`](data-objects#conversion-to-dtos) method, provided that the property names in your list object and DTO match up. Otherwise, you can override it and populate the DTO list manually, leveraging the `ToDataContractProperties` method for each data row.

### Criteria object

When the data list object is a primary object on your view, rather than a child list, you typically want to provide some filter criteria for the service operation, so that you don't retrieve the entire list, but only the relevant records. Such criteria are also usually specified by the users on the screen, and validated before running the search and retrieving the results.

To hold the values for the search criteria, `DataListObject` has a special member `CriteriaObject`, which you can set to your custom data object, as shown below, and then bind its data properties to the fields on your search criteria panel.

```cs
salesOrderList.CriteriaObject = ServiceProvider.GetService<SalesOrderCriteria>();
```

The custom data object needs to inherit from the `CriteriaObject` base class, and [add data properties](data-objects#data-properties-initialization) for each filter criteria as needed. For any field you can use an [`OperatorProperty`](properties/specialty#operatorproperty) to give the users extra flexibility when specifying the criteria. In this case, you will need to define additional properties that hold the actual criteria value(s), as follows.

```cs
// highlight-next-line
public class SalesOrderCriteria : CriteriaObject
{
    protected override void Initialize()
    {
        // add filter criteria by order date with operator and two value properties for the range
        OrderDateOperatorProperty = new OperatorProperty(this, OrderDateOperator)
        {
            EnumType = "operators",
        };
        OrderDateProperty = new DateProperty(this, OrderDate);
        OrderDate2Property = new DateProperty(this, OrderDate2);
    }
}
```

:::note
If you use the `OperatorProperty`, your service operation should accept and implement the specified filter operators, such as by using [query operators supported by Xomega Framework services](../services/querying#dynamic-linq-criteria).
:::

With the `CriteriaObject` being part of the base class `DataListObject`, view models in Xomega Framework will automatically validate its values before running the search.

When implementing the `DoReadAsync` method for retrieving the filtered data using a service operation, you can convert the data of your `CriteriaObject` to the input DTO for the operation, and pass it to the service call, as follows.

```cs
protected override async Task<ErrorList> DoReadAsync(object options, CancellationToken token = default)
{
// highlight-next-line
    SalesOrderCriteriaDTO criteria = CriteriaObject?.ToDataContract<SalesOrderCriteriaDTO>(options);
    using (var s = ServiceProvider.CreateScope())
    {
        var salesOrderService = s.ServiceProvider.GetService<ISalesOrderService>();
// highlight-next-line
        var output = await salesOrderService.ReadListAsync(criteria, token);
        await FromDataContractAsync(output?.Result, options, token);
        return output.Messages;
    }
}
```

### Applied criteria

Once the search successfully runs, and the data list object is populated with the results, it will extract the actual criteria that were used for the search from the `CriteriaObject`, and will store it in a separate property `AppliedCriteria`, which is a list of structures of type `FieldCriteriaSetting`.

You can use it to display a summary of the actually applied criteria on the screen, and refresh it whenever it changes, since changing `AppliedCriteria` will fire a regular `INotifyPropertyChanged` event. `FieldCriteriaSetting` structure stores the field, operator and the value(s) separately, so that you could style them on the screen individually.

:::note
Even though your `CriteriaObject` may have many properties, the `AppliedCriteria` will have only the criteria that have values, which creates a nice and short summary. You also don't want to generate that summary directly from the `CriteriaObject`, since it will be different when the user has changed the criteria without having applied them yet, which could be misleading.
:::

### Client filtering

If your data grid bound to your data list object needs to perform additional filtering on the client side by one or more columns, then `DataListObject` provides a handy utility method `PropertyValueMatches`, which checks if the value of a specified data property in a given row matches the specified criteria value using the supplied [operator](../services/querying#operators).

:::tip
You may need to translate data grid's client-side filter criteria to a number of operator/value clauses, and combine the results of the calls to `PropertyValueMatches` for each clause, in order to determine whether each row matches those filter criteria.
:::

### Resetting data

In order to reset the data in your data list object, as well as the `AppliedCriteria`, you can call the `ResetData` method. If you also want to clear the values in the `CriteriaObject`, then you should call `ResetData` on that object too, as follows.

```cs
myListObject.ResetData();
myListObject.CriteriaObject.ResetData();
```

:::note
This is what the *Reset* action usually does on the standard Xomega Framework search forms.
:::

## Sorting rows

`DataListObject` allows you to sort its rows locally using standard or custom sort criteria. In order to sort the data with a custom row comparison function, you can pass it to the `Sort` method, as follows.

```cs
Comparison<DataRow> compareRows = (r1, r2) => CompareRows(r1, r2); // custom comparison function
myListObject.Sort(compareRows);
```

### Sort criteria

To help you sort a data list object, Xomega Framework provides a class `ListSortCriteria`, which is an *ordered* list of `ListSortField` objects. Each of those defines a sort order by a specific data property in the list object, as well as the sort direction.

You can construct it and store in the `SortCriteria` property of your list object, which is intended to keep track of the currently applied sort criteria, and it will be used whenever you call the `Sort` method without parameters, as follows.

```cs
var sortField = new ListSortField()
{
    PropertyName = "MyProperty",
    SortDirection = ListSortDirection.Ascending
};
// highlight-next-line
list.SortCriteria = new ListSortCriteria() { sortField };
list.Sort();
```

If you want to sort a data list object using temporary sort criteria, without storing it in the `SortCriteria`, then you can do it using a custom comparison function, as follows.

```cs
var sortCriteria = new ListSortCriteria() { ... };
// highlight-next-line
myListObject.Sort(sortCriteria.Compare);
```

If the internal values of your sort properties at each row implement `IComparable`, then it will be used for comparing the rows. This allows you to compare typed properties, such as numeric or date/time, using the underlying data type. In all other cases, it will compare the values converted to the `DisplayString` format, which is how the user sees them on the screen.

:::note
Null values will be sorted first in the ascending order, and last in the descending order.
:::

## Row selection

`DataListObject` supports tracking row selection by having a `Selected` property on the `DataRow` objects. You can control whether you can select multiple rows or just a single row by setting the `RowSelectionMode` property to one of the following strings.
- `DataListObject.SelectionModeSingle` - at most one row can be selected. Selecting any row will clear the previous selection.
- `DataListObject.SelectionModeMultiple` - multiple rows can be selected.

:::note
Any other value will not be handled by the `DataListObject`, but the bound data grid can interpret it in a custom way. For example, blank value of the `RowSelectionMode` can mean that selection is not allowed, while other values may indicate a more detailed mode, such as contiguous selection only.
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

`DataListObject` provides a number of different ways to select (or deselect) a single row or multiple rows, depending on your `RowSelectionMode` setting, as demonstrated by the following examples.

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

This event allows you to write platform-independent UI logic based on the selection change. For example, upon selecting a row in a master data grid, you may trigger update of the details object to read and show the details for the selected row.

:::tip
This event also enables using `SelectedRows` or `SelectedRowIndexes` in the expressions for [computed properties](properties/base#computed-properties), such as to set enabling conditions for certain actions when a row is selected (e.g. the [SelectAction](#select-action)), or to show a calculated summary for the selected rows.
:::

If you need to trigger the `SelectionChanged` manually, you can call the `FireSelectionChanged` with no arguments, as follows.

```cs
dataListObject.FireSelectionChanged();
```

### Preserving selection

When refreshing the data in a data list object from the backend, it is often desirable to preserve the currently selected row, if it still exists in the new dataset. To support this, the data list object's `FromDataContractAsync` method handles options passed as `CrudOptions` with a `PreserveSelection` parameter set. You would typically pass it through the `ReadAsync` method as follows.

```cs
// highlight-next-line
var options = new DataObject.CrudOptions { PreserveSelection = true };
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

By default, the `DataListObject` will use the same comparison mechanism for the key values, as is used by the [sort criteria](#sort-criteria), in order to find the new selected rows.

:::tip
If that doesn't work for you, you can always override the method `SameEntity` on the `DataListObject` as needed.
:::

### Select action

For search views that that are intended for searching some entities, and then selecting one or more of such entities, `DataListObject` defines a standard `SelectAction`, which is configured to be enabled only when one or more rows are selected, as follows.

```cs
// highlight-next-line
Expression<Func<DataListObject, bool>> xSel = lst => lst.SelectedRows.Any();
SelectAction.SetComputedEnabled(xSel, this);
```

This allows you to bind the `SelectAction` to a *Select* button on your search screen, and have it disabled when there is no selection.
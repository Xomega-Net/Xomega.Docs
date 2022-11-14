---
sidebar_position: 2
---

# Search View Models

Xomega Framework defines a base class `SearchViewModel` that is designed to support the classic search views, where you specify some search criteria, run the search, and view the search results in a data grid view.

The results grid will typically allow you to perform further actions on specific rows, such as opening the details views for each record, performing certain business actions with the rows, or simply returning the selected record(s) to the parent view.

You may also have some versions of search view models that don't have any search criteria for the user to specify and will display the results data right upon opening the view.

## Data objects

The `SearchViewModel` stores a [`DataListObject`](../data-lists) in its `List` property, which in turn stores an instance of a [`CriteriaObject`](../data-lists#criteria-object) for specifying the search criteria. You need to initialize the `List` data object to an instance of a concrete class for your specific view model. If your search view model supports criteria, then you should also initialize the `List.CriteriaObject` member, as illustrated below.

```cs
// highlight-next-line
public class SalesOrderListViewModel : SearchViewModel
{
    public override void Initialize()
    {
        base.Initialize();
// highlight-start
        List = ServiceProvider.GetService<SalesOrderList>();
        List.CriteriaObject = ServiceProvider.GetService<SalesOrderCriteria>();
// highlight-end
    }
}
```

:::note
Search views for some UI technologies, such as WebForms, may later overwrite the initialized data list object with a cached one, which they retrieve from the current user's session.
:::

## Activation

Activation of a search view model initializes its data objects from the passed `NameValueCollection` parameters, and runs any actions, as specified by those parameters. For example, passing a parameter `ViewParams.SelectionMode.Param` will set the [`RowSelectionMode`](../data-lists#row-selection) on the list object and will enable [selection support](#selection-support).

### Auto-search

Other regular parameters will be used to pre-populate the matching data properties of the `CriteriaObject`. If you pass a parameter `ViewParams.Action.Param` with a value `ViewParams.Action.Search`, or if you have no `CriteriaObject`, then the activation process will try to automatically run the search based on the pre-populated criteria (or no criteria, as configured).

### Auto-select

If your search view model supports selection, you can also pass the `ViewParams.Action.Param` parameter with a value `ViewParams.Action.Select`, which will not only run the search but will also try to auto-select the result, if there is one and only one matching record returned. In this case, the activation will return `false`, which means that the view does not need to be opened.

## Running the search

The `SearchViewModel` class provides the `SearchAsync` and `Search` methods that are called from the handlers of the *Search* button on your view. These methods validate the `List` object, as well as its `CriteriaObject`, and abort if there are any validation errors. Otherwise, they call the `ReadAsync` or `Read` methods on the `List` object, which run the search and [populate the results data](../data-lists#populating-data).

If there are any validation errors, or any service errors or warnings while running the search, it will collect them and set the [`Errors`](view-models#error-list) property, which will get reflected in the bound view's *Error List* control.

### Collapsing criteria

If there are no errors, then the search methods will set the `CriteriaCollapsed` to `true`, which will fire an appropriate `INotifyPropertyChanged` event. Based on that event, the bound view will be able to collapse the criteria panel to maximize the space for the results. It may also update a panel bound to the [`AppliedCriteria`](../data-lists#applied-criteria) of the `List` object to show a summary of the currently applied criteria.

:::tip
You can control whether your search view model should auto-collapse the criteria panel when running the search successfully by overriding the `AutoCollapseCriteria` property in your view model, as follows.

```cs
protected override bool AutoCollapseCriteria => false;
```
:::

### Preserving selection

By default, both `SearchAsync` and `Search` methods try to preserve the current selection in the `List` object after running the search. If you don't want to preserve the selection, you can override them, and call the corresponding version with a `false` argument, as follows.

```cs
public override async Task SearchAsync(CancellationToken token = default)
{
// highlight-next-line
    if (await SearchAsync(false, token) && AutoCollapseCriteria)
        CriteriaCollapsed = true;
}
```

### Resetting data

The `SearchViewModel` also implements a `Reset` method that clears the data in both the `CriteriaObject` and the results `List` and expands the criteria panel to allow the users to enter new criteria and run the search. You would typically call this method from an event handler for the *Reset* button on your view.

## Selection support

You can use a search view model to let the users find specific records using certain criteria, and then allow them to select one or more records, and return those to the calling parent view. In this case, the `List` object on your view model should [support selection](../data-lists#row-selection), and your bound view would typically have a *Select* button bound to its [`SelectAction`](../data-lists#select-action).

### Handling selection

The base class `SearchViewModel` provides methods `SelectAsync` and `Select` that you can call from the handler of the *Select* button. These methods fire a [view event](view-models#view-events) `ViewSelectionEvent`, which captures the selected data rows, and then closes the current view. Your parent view needs to handle the `ViewSelectionEvent` in the overridden `OnChildEventAsync`, as illustrated below.

```cs
protected override async Task OnChildEventAsync(object sender, ViewEvent e, CancellationToken token = default)
{
    ViewModel child = sender as ViewModel;
// highlight-start
    if (e is ViewSelectionEvent vse && child?.Params?[ViewParams.QuerySource] == "LinkCustomerLookup")
        PopulateCustomer(sender, vse.SelectedRows);
// highlight-end

    await base.OnChildEventAsync(sender, e, token);
}
```

:::note
If you have more than one action that opens up a selection view from your parent view model, then you can pass a `ViewParams.QuerySource` parameter with the source of the selection action, and use it in the callback to figure out what to populate in your view from the selected results.
:::

### Auto-select behavior

As mentioned [above](#auto-select), search view models provide the `AutoSelectAsync` and `AutoSelect` methods, which allow you to auto-select the row and fire a `ViewSelectionEvent` during activation, if the search criteria resulted in a single row.

If the search returned **more than one row**, then it will collapse the criteria panel, and let the user manually select the desired row. If the search resulted in **no matches** though, then it will expand the criteria panel, so that the user could update the criteria and run the search again.

## Child view updates

When you open a child view from your search view, such as the details view for the selected record, your search view will need to react to the events in your child view. If you use [view model navigation](view-models#view-model-navigation) to open the child view, it will automatically subscribe your view model to the child view events.

The `SearchViewModel` class implements some of the common actions in response to the child view updates, as outlined below.

### Refreshing the view

If the child view is saved or deleted, the `SearchViewModel` will automatically refresh its main data list object to reflect the changes made in the child view that may have affected its results. To refresh the view, the view model will run the search again using the current criteria and a flag to preserve selection.

### Updating selection

When a child details view is opened from the `SearchViewModel`, it will try to locate the corresponding row in its `List` object using the matching [key properties](../data-lists#preserving-selection) in both the details object and the list object, and then select that row to highlight it in the bound data grid.

When you close a child details view that has matching key properties, the `SearchViewModel` will clear the row selection to no longer highlight the row, whose details were opened.

### Showing/hiding columns

When you open details child views from a parent search view as a side panel (i.e. using `Inline` mode), its view model will keep track of the total number of such views using the `OpenInlineViews` property.

For example, if you open a side panel in the master-details view, the value of that property will be 2, with each panel taking up half the screen. If you then open another view from the details panel on the side, that value will be 3, meaning that each open view will take a third of the screen's horizontal width.

In these cases, depending on how you configure the data grid for the main search view, it may either shrink each column to half/third of their width or add a horizontal scrollbar, with only a half/third of the columns visible at a time.

Xomega Framework assumes that the user would be focused on the details panel and any of its child views, while those are open so that the main data grid only needs to show the key columns to be able to identify the entity that the user is working with. Therefore, it will make the remaining half (or two-thirds) of its properties invisible to hide the corresponding columns when you open child views inline, assuming that the most important columns go first in the `List` data object.

:::tip
To control which columns will be shown when inline child views are open, you can configure the order of importance for the `List` object's properties by overriding the `RankedProperties` property in your search view model, as shown below.

```cs
// return properties in a custom order
protected override IEnumerable<DataProperty> RankedProperties => List.Properties;
```
:::

When the user closes the inline child views, the value of the `OpenInlineViews` property will change, and the search view model will reveal more columns based on the new value.

:::tip
If you want to implement custom behavior for hiding columns in response to the opening or closing inline child views, or if you want to turn that behavior off completely, you can override the `UpdateColumnVisibility` method in your view model accordingly.
:::
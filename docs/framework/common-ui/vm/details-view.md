---
sidebar_position: 3
---

# Details View Models

Details view models are designed for views that allow displaying and editing details of a certain single entity, such as a sales order. This is implemented by the `DetailsViewModel` class, which supports a single *Save* operation, as well as a *Delete* operation.

## Data object

`DetailsViewModel` class stores the main [data object](../data-objects) in its `DetailsObject` property, so you need to initialize it to your specific class using the `ServiceProvider` in the `Initialize` method. To provide access to the data object of your concrete type, you can also expose it as a separate property, as illustrated below.

```cs
// highlight-next-line
public class SalesOrderViewModel : DetailsViewModel
{
// highlight-next-line
    public SalesOrderObject SalesOrder => DetailsObject as SalesOrderObject;

    public override void Initialize()
    {
        base.Initialize();
// highlight-next-line
        DetailsObject = ServiceProvider.GetService<SalesOrderObject>();
    }
}
```

:::note
Details views for some UI technologies, such as WebForms, may later overwrite the initialized data object with a cached one, which they retrieve from the current user's session.
:::

## Activation

`DetailsViewModel` allows you to activate the details view for both an existing entity and for creating a new entity, as described below.

### Opening existing entity

When opening details for an existing entity, you need to pass the entity's key(s) as the [activation parameters](view-models#activation), which means that you would typically open it from another view model as a child view, as shown below.

```cs
// open sales order view for an existing order
NameValueCollection query = new NameValueCollection()
{
// highlight-next-line
    { "SalesOrderId", salesOrderId }
};
await NavigateToAsync(salesOrderVM, salesOrderView, query, this, salesOrderListView, token);
```

### Creating a new entity

To create a new entity though, you don't need to pass in the keys, but rather a `ViewParams.Action.Param` parameter with a value `ViewParams.Action.Create`, as follows.

```cs
// open sales order view to create a new order
NameValueCollection query = new NameValueCollection()
{
// highlight-next-line
    { ViewParams.Action.Param, ViewParams.Action.Create }
};
await NavigateToAsync(salesOrderVM, salesOrderView, query, null, null, token);
```

Since the create view doesn't require any dynamic input parameters, you can open it as a primary view, and pass `null` as the source view and source view model arguments. With web-based frameworks, you can also open it with a static URL from the main menu, such as "*SalesOrderView?_action=create*".

:::tip
You can also pass some values for the object's data properties in the activation parameters, in order to pre-populate it with certain values. The `DetailsViewModel` will call the [`SetValuesAsync`](../data-objects#data-initialization) or `SetValues` methods for the input parameters to initialize its data object's data, and will set the object as [not modified](../data-objects#modification-tracking) initially.
:::

While the object is being created, the [`IsNew`](../data-objects#isnew-property) property of the `DetailsObject` will be `false`, until it is successfully saved. Changing this property will trigger a standard `INotifyPropertyChanged` event, which would allow updating certain things on the view. For example, the [view title](view-models#view-title) for new objects may look different for new objects than for existing objects, and say something like "*New Sales Order*".

### Loading data

If you open details for an existing entity and pass the key(s) as the parameters, the activation process will set the keys to the corresponding data properties and will call the `LoadDataAsync` or `LoadData` methods respectively, to load the entity data for the data object. Those will effectively call the [*Read* operation on your data object](../data-objects#read-operation), but you can override that behavior, as needed.

Any error messages from the *Read* operation will be stored in the [`Errors`](view-models#error-list) property and would be shown in the bound *Error List* control on the view.

:::warning
You can also manually call the `LoadDataAsync` or `LoadData` methods at any other point, in order to refresh the view's data from the service, but it **will not check or prompt for unsaved changes**, which may be dangerous. You would need to override these methods and implement those checks in your subclass if this is needed.
:::

## Saving changes

As the user makes edits to the data properties of the main `DetailsObject` through the bound UI controls, that object will be set as modified, and the [view title](view-models#view-title) will typically show an asterisk to indicate the modification state. If the *Save* button is bound to the *SaveAction*, it will only become enabled when the view is modified.

The view model provides the `SaveAsync` and `Save` methods that can be called from the *Save* button's handler, and will in turn call the [*Save* operation on the data object](../data-objects#save-operation). If there are any errors during validation or execution of the service call, those will be stored in the [`Errors`](view-models#error-list) property, and displayed in the bound *Error List* control on the view.

If the save was successful with no errors, then the view model will [fire a view event](view-models#general-view-events) `ViewEvent.Saved` that other view models can listen to and handle, as appropriate.

## Deleting the entity

The details view may also have a *Delete* button that allows deleting the current entity. The reason to perform a delete from the details view, rather than from a corresponding list view, is that the user would have to open and review the full entity details before deleting it, which would minimize the risk of accidentally deleting a wrong entity.

:::note
If the *Delete* button is bound to the *DeleteAction* of the main data object, then it will be enabled only when the [`IsNew`](../data-objects#isnew-property) property is `false`, and disabled when you create a new entity.
:::

Similar to the Save actions, the `DetailsViewModel` provides `DeleteAsync` and `Delete` methods that can be called from the *Delete* button's handler, and will in turn call the [*Delete* operation on the data object](../data-objects#delete-operation). If there are any errors during the execution of the service call, they will be stored in the [`Errors`](view-models#error-list) property, and displayed in the bound *Error List* control on the view.

If the delete was successful with no errors, then the view model will [fire a view event](view-models#general-view-events) `ViewEvent.Deleted` that other view models can listen to and handle, as appropriate. After firing the event, the view will be automatically closed.

## Child events

Your details view may allow opening other child details views from it, editing which may affect the data in your details view.

For example, if you have a *Sales Order* details view that contains a child list of the line items for the sales order, then clicking on an individual line item may open up a separate *Line Item* details view. When the user saves or deletes a line item from a separate view, you may need to reload the data in the parent *Sales Order* view to reflect those changes.

 The `DetailsViewModel` class implements some default behavior for handling view events of such child details views, as follows.
 
 When the child view is opened or closed, it uses the `UpdateDetailsSelection` method to find a corresponding row in one of its child data list objects, and then select or deselect that row in order to highlight it for the user, as needed. When the child details view is saved or deleted, it will also call the `LoadDataAsync` or `LoadData` methods to [reload the data](#loading-data) in the view.

:::tip
You can override the `UpdateDetailsSelection` method in your concrete view model to customize the way it handles the selection of the child rows for the open child views. You can also leverage the `UpdateListSelection` method in your overridden implementation, as needed.

If you need to customize the way data is reloaded upon saving or deletion of the child views, then you need to override the `OnChildEventAsync` and `OnChildEvent` methods, as appropriate.
:::
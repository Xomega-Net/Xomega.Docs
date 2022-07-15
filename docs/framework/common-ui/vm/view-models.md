---
sidebar_position: 1
---

# View Models

View models are classes that allow you to implement abstract presentation logic for different types of UI views regardless of the specific UI framework that is used for the views. This makes this logic reusable between various .Net-based UI technologies, such as Blazor, WebForms, WPF, etc.

View models for data-driven views typically contain a main [data object](data-objects) or [data list object](data-lists), or possibly a number of data objects, which encapsulate the main logic for working with the view's data. This leaves the view models to enhance this logic with view actions, navigation, error handling and other functions that are not provided by their data objects.

## UI views

The user interface of your application is composed of UI views that are independent parts of the UI implemented using a specific UI framework like Blazor. You can either navigate to a view as a primary view, such as a screen with a list of entities, or open a view as a child from an existing view, such as by clicking/selecting an entity to view its details.

### Binding view models

The view models hold the state for the views and the platform-independent presentation logic for any actions, and they get bound or attached to their views by calling the `BindTo` method on the view, as follows.

```cs
// highlight-next-line
myView.BindTo(myViewModel); // binds the view to a view model
myView.BindTo(null); // unbinds the view from the currently bound view model
```

:::note
After binding a view model to a view, you can also construct and initialize a **new view model**, and then bind it **to the same view**, in order to replace its data. For example, a details panel in a master-details view can display details for different selected entities, with each entity having its own view model.
:::

Binding a view to a view model will initialize it using the view model's parameters, subscribe it to view model events, and will bind view controls to the view model's data objects, actions and data properties. It will also store the reference to that view in the view model's `View` property. Unbinding the view from a view model will reset its properties, unbind controls, and unsubscribe it from any events.

Having a reference to the bound view allows view models to call the view's platform-specific functions through the `IView` and `IAsyncView` interfaces implemented by that view. Those functions include showing the view using the desired mode (popup vs. inline), checking if the view can be closed (potentially prompting for unsaved changes), and actually closing the view.

## View model members

In addition to the reference to a bound view, view models include (but are not limited to) the following members.

### Data objects

View models typically contain a primary data object or a data list object, which holds the data for the view in its data properties or child objects. The data objects and their properties get bound to the appropriate UI controls in the view when you [bind it to the view model](#binding-view-models).

The view model initiates reading the data for data objects from the services, as well as using the current data object's data to call any service operations.

### Error list

View models store and manage an `ErrorList` of all the errors, warnings and other messages that were generated during the last operation. It is stored in the `Errors` property, which sends an `INotifyPropertyChanged` event whenever it is assigned to a new error list. This allows you to bind it to a generic error panel that shows a summary of the current validation and service errors to the user.

### View actions

View models typically define [action properties](properties/action) that can be bound to action buttons on your view, which allows you to control the state of the buttons from the view model. They also implement the methods for handling the actions in a platform-agnostic way, which can be attached as handlers to the action buttons, or invoked from the view's action handlers.

The base class `ViewModel` defines a common `CloseAction`, but more specific view models, such as for search or details views, can define additional actions, e.g. for running the search or saving the details.

### View title

The base `ViewModel` class has a virtual property `ViewTitle` that can be used to display the title of the view. By default, it returns another virtual property `BaseTitle`, which gets a localized title from the [current resource manager](../services/errors#resources), using a resource key composed from the class name and the "*View_Title*" suffix. For example, if your class name is *SalesOrderViewModel*, then the key will be *SalesOrderView_Title*.

:::tip
You can override the `GetResourceKey` method if you want to change the resource key for your view model.
:::

Specific view model subclasses can override the `ViewTitle` property as needed, and use the `BaseTitle` to construct the final title. For example, details view model adds an asterisk to indicate that the view has been modified, and adds "*New* " to the title when creating a new entity, e.g. "*New Sales Order*".

:::tip
If you want to customize the view title, then you can override the `BaseTitle`, in order to reuse the logic of the `ViewTitle` property, such as the `*` for modified views. For example, if you want to display the sales order number in the title for existing sales orders, e.g. "*Sales Order - SO123*", then you can override it as follows.

```cs
public override string BaseTitle => base.BaseTitle +
    (salesOrderObj.IsNew ? "" : " - " + salesOrderObj.SalesOrderNumberProperty.Value);
```
:::

`ViewModel` class implements the `INotifyPropertyChanged` interface, which allows the view to subscribe to the changes of the `ViewTitleProperty`, and update the title accordingly. This allows updating the view title on the details screen when the view is modified or after it has been saved.

You can also manually trigger the change event from your view model when the values for your `ViewTitle` have changed, as follows.

```cs
OnPropertyChanged(new PropertyChangedEventArgs(ViewTitleProperty));
```

## Initialization and activation

Your view models should extend from the `ViewModel` class, or from one of its subclasses, and override any methods or properties as needed.

### Initialization

View models are instantiated by the DI container, so they should have a constructor that takes a service provider and passes it to the base class. However, you should do any initialization, such as creating data objects, in the overridden `Initialize` method, as follows.

```cs
public class SalesOrderViewModel : DetailsViewModel
{
// highlight-next-line
    public SalesOrderViewModel(IServiceProvider serviceProvider) : base(serviceProvider)
    {
    }

// highlight-next-line
    public override void Initialize()
    {
        base.Initialize();
        DetailsObject = ServiceProvider.GetService<SalesOrderObject>();
    }
}
```

:::note
The base class will create a new scope within the service provider for each view model. This way, any scoped services instantiated by the view model will be cleaned up when the view model is disposed.
:::

### DI registration

To register your view models with the DI service collection, we recommend you to create a static class `ViewModels` with an extension method `AddViewModels` that adds transient view models of each type, as follows.

```cs title="ViewModels.cs"
public static IServiceCollection AddViewModels(this IServiceCollection services)
{
    ...
// highlight-next-line
    services.AddTransient<SalesOrderViewModel, SalesOrderViewModel>();
    return services;
}
```

This will allow you to register all view models with a single line of code in your application's `Startup` class, as follows.

```cs title="Startup.cs"
public void ConfigureServices(IServiceCollection services)
{
    ...
// highlight-next-line
    services.AddViewModels();
}
```

### Activation

Opening a view in Xomega Framework allows you to pass it a number of named parameters as a `NameValueCollection`, which can be either manually created and populated, or constructed from from a query string, for example. This allows you to initialize your view model with some data, pass various modes to the view, or have the view perform a certain action during activation.

After the view model is constructed, you need to activate it by calling the `ActivateAsync` method, and pass it a collection of named parameters for the activation. During activation the view model will store those parameters in its `Params` property, which you'll be able to access at any point thereafter.

:::caution
There is also a synchronous method `Activate` to activate the view, but we recommend using the `ActivateAsync`, which would allow you to read data using remote service calls.
:::

During the activation, the view model may initialize the values of its data objects from the passed parameters, configure its actions, read the data for the view and run some actions, as needed. Xomega Framework has a static class `ViewParams` that defines a number of common parameters and their potential values using inner classes and string constants, so that you won't have to hardcode those.

The `ActivateAsync` method returns a `bool`, which indicates whether or not you need to bind and show the actual view after activating the view model. In some cases, based on the passed action, the activation logic will perform all the necessary action, so that showing the view would not be needed.

For example, when invoking a search view, in order to select a single entity, and passing some initial criteria to it, if that criteria results in a single record, the search view model may auto-select that record and notify the parent view model, so that displaying the actual search view would not be necessary, as illustrated by the following code block.

```cs title="SalesOrderViewModel.cs"
NameValueCollection query = new NameValueCollection()
{
    { ViewParams.Action.Param, ViewParams.Action.Select },
    { ViewParams.SelectionMode.Param, ViewParams.SelectionMode.Single },
    { "PersonName", personName },
    { ViewParams.Mode.Param, ViewParams.Mode.Popup },
    { ViewParams.QuerySource, "LinkCustomerLookUp" },
};
ViewModel customerListVM = ServiceProvider.GetService<CustomerListViewModel>();
SubscribeToChildEvents(customerListVM);

// highlight-next-line
bool showView = await customerListVM.ActivateAsync(query);
if (showView)
{
    customerListView.BindTo(customerListVM);
    await customerListView.ShowAsync();
}
```

:::note
Note how you can pass a view mode using the `ViewParams.Mode.Param`, which can be either `ViewParams.Mode.Popup` for displaying the child view as a popup, or `ViewParams.Mode.Inline` for showing it as a master-details view. If this parameter is not passed, the view will open as a primary view in full screen.
:::

:::tip
Usually you don't need to call `ActivateAsync` directly, but use the [view model navigation](#view-model-navigation) instead, in order to open a view.
:::

## View events

View models can notify other listeners about both the changes of its properties and the general view events, such as when the view is opened, closed, saved, etc.

### View property events

As we mentioned before, view models implement the standard `INotifyPropertyChanged` interface, which means that you can subscribe to its `PropertyChanged` event, and listen to the changes of its properties. You can also manually trigger the `PropertyChanged` event from your view model by calling the `OnPropertyChanged` method.

This also allows you to use view model properties in the expressions for any [computed properties](properties/base#computed-properties). For example, if you have a tab control on your view, then you can bind the active tab's index to a property on your view model, and use it to calculate values/editability of other properties.

### General view events

In addition to property changes, view models provide general events `ViewEvents` and `AsyncViewEvents` that use a `ViewEvent` class, in order to notify outside listeners about major changes in the view's state, such as when the view is opened/closed, saved, deleted, etc. Your can fire a view event from your view model using the `FireEventAsync` and `FireEvent` methods, as follows.

```cs
await FireEventAsync(ViewEvent.Saved, token); // fire a view event asynchronously
FireEvent(ViewEvent.Saved); // fire a view event synchronously
```

The `ViewEvent` class provides a number of static events that you can use out of the box. When subscribing to the view events from another view model, you can check the type of event using standard methods, such as `IsSaved` or `IsDeleted` as follows.

```cs
myViewModel.AsyncViewEvents += OnMyViewEventAsync;
...
private async Task OnMyViewEventAsync(object myViewModel, ViewEvent e, CancellationToken token = default)
{
// highlight-next-line
    if (e.IsSaved() || e.IsDeleted())
    {
        // perform an action when myViewModel is saved or deleted
    }
}

```

### Child view events

`ViewModel` class has a method `SubscribeToChildEvents` that allows it to subscribe to any view events raised by the child views that are opened from the current view. By default the view model just re-publishes that view event, but adds a `ViewEvent.Child` flag to it, as follows.

```cs
protected async Task OnChildEventAsync(object childViewModel, ViewEvent e, CancellationToken token = default)
{
// highlight-next-line
    await FireEventAsync(childViewModel, e + ViewEvent.Child, token);
}
```

When listening to such events, and checking `IsSaved` or `IsDeleted` on the them, you can pass a boolean to indicate whether the save or delete should come directly from the child view (`true`), or if it may come from any of of its own children (`false`).

The subclasses of view models may override the `OnChildEventAsync` or `OnChildEvent` methods to refresh their data, when their child view fires a *Saved* or *Deleted* events, as illustrated below.

```cs
protected override async Task OnChildEventAsync(object childViewModel, ViewEvent e,
                                                CancellationToken token = default)
{
// highlight-next-line
    if (e.IsSaved(false) || e.IsDeleted(false))
    {
        await LoadDataAsync(true, token); // reload child lists if a child was updated
    }

    await base.OnChildEventAsync(childViewModel, e, token);
}
```

:::note
As an example of handling child view events, the Blazor views bound to the view model listen to the opening and closing of the child views, and then update the `OpenInlineViews` property on the view model to track the number of open child views in the `Inline` mode. This property, in turn, helps the view model to [reconfigure the number of visible elements](search-view#showing--hiding-columns) on the screen based on the presumably available real estate.
:::

## View model navigation

View models provide a couple of static utility methods `NavigateToAsync` and `NavigateTo` that help you to open a new view or populate an existing view with new data. You need to pass it both the current view and view model, as well as the target view, target view model and activation parameters.

These methods will check if the current view can be closed (e.g. by asking the user about discarding unsaved changes), and then will subscribe the current view model to listen to any [view events](#general-view-events) from the target view model, and will activate the target view model and bind it to the target view.

If the target view is different from the current view, it will close the current view. Next, it will bind the target view to the target view model, show the target view, and fire the `ViewEvent.Opened` view event.

The following example shows how to navigate asynchronously to a new *CustomerListView* with specific parameters, in order to select a customer from a *SalesOrderViewModel*.

```cs title="SalesOrderViewModel.cs"
NameValueCollection query = new NameValueCollection()
{
    { ViewParams.Action.Param, ViewParams.Action.Select },
    { ViewParams.SelectionMode.Param, ViewParams.SelectionMode.Single },
    { "PersonName", personName },
    { ViewParams.Mode.Param, ViewParams.Mode.Popup },
    { ViewParams.QuerySource, "LinkCustomerLookUp" }
};
ViewModel customerListVM = ServiceProvider.GetService<CustomerListViewModel>();
// highlight-start
bool success = await NavigateToAsync(customerListVM, customerListView, query,
                                     this, salesOrderView, token);
// highlight-end
```

:::note
Just like the activation functions, the `NavigateToAsync` and `NavigateTo` methods return a `bool` that indicates whether or not the view was opened successfully. It may return `false` if the user decided not to discard unsaved changes, or if the `ActivateAsync` method returned `false`.
:::

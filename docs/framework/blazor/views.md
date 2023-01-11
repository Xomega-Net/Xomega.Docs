---
sidebar_position: 1
---

# Blazor Views

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Blazor views in Xomega Framework are high-level components that can be bound to [View Models](../common-ui/vm/view-models) and represent independent parts of the user workflow within your application. To make them reusable, you can design your views to allow either navigating to them directly via a browser URL or opening them as child views that are embedded into a parent view.

:::tip
Blazor views can be reused in both Blazor Server and WebAssembly architectures. Therefore, we recommend that you define them, as well as other Blazor components, in a separate project that is referenced from either the *Blazor.Server* or *Blazor.Wasm* projects.
:::

## Base Blazor views

The framework provides a base class `BlazorView`, that all views extend from, including more specialized subclasses, such as `BlazorSearchView` and `BlazorDetailsView`. When defining a view, make sure that it inherits from one of the base views.

The base view has a `Visible` parameter, which is set to `false` by default and is used to show or hide the view. To make sure that the view is not visible when this parameter is off, you need to wrap your view in the `@if (Visible) {...}` clause, as follows.

```razor title="SalesOrderListView.razor"
<!-- highlight-next-line -->
@inherits BlazorSearchView

<!-- highlight-next-line -->
@if (Visible)
{
<div @ref="MainPanel" class="@UpperClass">
...
</div>
}
```

:::note
You should also initialize the top-level element to the base `MainPanel` member, as shown above. That would allow the base class to pop up your view as a [modal dialog](#popup-child-views).
:::

### Binding to view models

The base view stores the [`ViewModel`](../common-ui/vm/view-models) it's currently bound to in the `Model` property. However, to initialize it when the view is created, you need to inject it as a new member of a concrete view model class and then bind your view to it in the `OnInitialized` method, as shown below.

```razor title="SalesOrderListView.razor"
@using Xomega.Framework.Views
...
<!-- highlight-next-line -->
@inject SalesOrderListViewModel VM
@code
{
    protected override void OnInitialized()
    {
        base.OnInitialized();
<!-- highlight-next-line -->
        BindTo(VM);
    }

    public override void BindTo(ViewModel viewModel)
    {
<!-- highlight-start -->
        VM = viewModel as SalesOrderListViewModel;
        base.BindTo(viewModel);
<!-- highlight-end -->
    }
}
```
:::tip
Using the concrete view model class and a short member name, such as `VM`, allows your Blazor components to easily access specific members of your view model from the markup without having to cast it, e.g., `@VM?.OrderList?.OrderDateProperty`.
:::

:::note
You also need to override the `BindTo` method and store the passed model in your specific member (`VM`) for the cases when your view gets bound to another view model, such as when showing details for a different entity.
:::

## Navigation to Blazor views 

You can open a new Blazor view either as a top-level view to start a new workflow or as a child view of one of the currently open views within the same workflow.

### Top-level views

To open a view as a top-level view, you can navigate to it via a browser URL by clicking a hyperlink or by calling the standard Blazor `NavigationManager.NavigateTo` method. This will close the workflow associated with the current top-level view and start a new workflow for the target view.

:::warning
The **state of the current view will be reset**, so if you try to navigate back to it later, then it will open in its initial state.
:::

If you define your view as a shared component that can be used both as a top-level view and a child of another view, then for the former, you will need to wrap it in a separate *Page* component, where you specify the URL route using the `@page` directive. Since the view is not visible by default, you will also need to set the `Visible="`true"` parameter as follows.

```razor title="SalesOrderListViewPage.razor"
<!-- highlight-next-line -->
@page "/SalesOrderListView"
@attribute [Authorize]

<!-- highlight-next-line -->
<SalesOrderListView ActivateFromQuery="true" Visible="true"></SalesOrderListView>
```

To activate the view model from the query parameters of the URL, you also want to set the `ActivateFromQuery="true"` parameter, as shown above. This will allow you to pass values in the query string to pre-populate the view data or criteria and invoke some actions upon opening the view.

For example, navigating to `/SalesOrderView?SalesOrderId=45305` can open details of the specified sales order while going to the URL `/SalesOrderListView?OrderDate=2012-01-01&OrderDateOperator=EQ&_action=search` will automatically run the search for sales orders made on *01/01/2012*.

Normally, top-level views do not have a *Close* button, and the base view model sets its `CloseAction` property as not visible to hide any bound *Close* buttons in cases when you need those to allow opening and closing the view as a child.

:::caution
When you navigate to another top-level view, the current view **will not prompt for unsaved changes**.

*Note: [Preventing Blazor navigation](https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/routing?view=aspnetcore-7.0#handleprevent-location-changes) has been added in ASP.NET Core 7, so you'll be able to implement the unsaved changes prompt in your top-level views if you use .NET 7.*
:::

### Child views

Child views are embedded in their parent view and can be opened either inline or as a modal popup dialog. Normally, the mode for how the child view must be opened is passed to the view model using the `ViewParams.Mode.Param` [activation parameter](../common-ui/vm/view-models#activation) and the view just open in the specified mode.

#### Inline child views

To allow showing a child view inline with the view's main content, the parent view needs to add them both to a container that will adjust accordingly when the child view is open. The base class `BlazorView` provides support for a **responsive Bootstrap layout system**, where you can place both the main content and the child view in a `d-flex` container to open the child on the side as follows.

```razor title="SalesOrderListView.razor"
<div @ref="MainPanel" class="@UpperClass">
  <div class="@MiddleClass">
<!-- highlight-next-line -->
    <div class="d-flex">
      <div class="@GetViewCol(null) @LowerClass">[...]
<!-- highlight-next-line -->
      <SalesOrderView @ref="cvSalesOrderView" Class="@GetViewCol(cvSalesOrderView)"></SalesOrderView>
    </div>
  </div>
</div>
```

We use the `GetViewCol` method to calculate the layout classes for the main content and the child views. For the child view, we pass it to the `Class` parameter that it can use for the class of the top-level element either directly or as part of the `UpperClass` property. You can learn more about the layout of inline child views in the [section below](#laying-out-child-views).

To let the base `BlazorView` class know about the child views for your view, you need to override the `ChildViews` property and return the array of all children of your view as follows.

```razor title="SalesOrderListView.razor"
...
@code
{
    protected SalesOrderView cvSalesOrderView;

<!-- highlight-start -->
    protected override BlazorView[] ChildViews => new BlazorView[]
    {
        cvSalesOrderView,
    };
<!-- highlight-end -->
}
```

:::note
When you open your child view inline as a master-details view and then click on another record, it will just bind the view model for the new record to the already open view instead of closing that child view and reopening it. It will still ask you for any unsaved changes, though, and will cancel the action, if you opt not to discard the unsaved changes.
:::

#### Popup child views

When your child view model is activated with the `Mode` value of `ViewParams.Mode.Popup`, it will try to open the child view as a Bootstrap modal dialog. This will also make the view model's `CloseAction` visible, which should display any *Close* buttons that are bound to that action.

If you want to design your view in such a way that it can be opened both as a modal dialog or as an inline view, then you can use the `@LowerClass` property for the view content, place it in a `d-flex` container with all its child views, and then wrap it in two more containers with the `@MiddleClass` and `@UpperClass` classes. In the popup mode, those properties will return Bootstrap's `modal-content`, `modal-dialog`, and `modal` classes, respectively, as illustrated in the [general view structure](#general-view-structure).

### Opening views

When you need to open a child view in response to clicking a hyperlink in your view, your callback function in the view should just **delegate it to the view model**, which in turn would call the base method `NavigateToAsync` that checks if the current view should and can be closed before opening a new child view or binding a new view model to an already open view.

[Writing navigation code in the view model](../common-ui/vm/view-models#view-model-navigation) makes it reusable for other types of views bound to that model. The following snippets illustrate this approach.

<Tabs>
  <TabItem value="view" label="SalesOrderView.razor">

```razor
...
    <XGridColumn Property="@VM?.MainObj?.DetailList?.ProductIdProperty" Width="20%">
        <Template>
        <a role="button"
<!-- highlight-next-line -->
            @onclick="async () => await LineItem_ClickAsync(context as DataRow)"
            class="btn-link @(DisabledIfNot(VM?.LineItem_Enabled(context as DataRow)))">
            <XDataText Property="@VM?.MainObj?.DetailList?.ProductIdProperty"></XDataText>
        </a>
        </Template>
    </XGridColumn>
...

@code
{
<!-- highlight-next-line -->
    protected async Task LineItem_ClickAsync(DataRow row, CancellationToken token = default)
    {
        if (VM == null || VM.LineItem_Enabled(row)) return;
<!-- highlight-start -->
        await VM.LineItem_CommandAsync(cvSalesOrderDetailView, // target view
            cvSalesOrderDetailView.Visible ? cvSalesOrderDetailView : null, // current view
            row, token);
<!-- highlight-end -->
    }
}
```

  </TabItem>
  <TabItem value="vm" label="SalesOrderViewModel.cs">

```cs
public bool LineItem_Enabled(DataRow row)
{
    return true;
}

/* highlight-start */
public async Task LineItem_CommandAsync(IAsyncView tgtView, IAsyncView curView,
                                        DataRow row, CancellationToken token = default)
/* highlight-end */
{
    NameValueCollection parameters = new NameValueCollection()
    {
        { "SalesOrderDetailId", MainObj.DetailList.SalesOrderDetailIdProperty
                                       .GetStringValue(ValueFormat.EditString, row) },
/* highlight-next-line */
        { ViewParams.Mode.Param, ViewParams.Mode.Popup },
        { ViewParams.QuerySource, "LineItem" },
    };

    ViewModel tgtModel = ServiceProvider.GetService<SalesOrderDetailViewModel>();
/* highlight-next-line */
    await NavigateToAsync(tgtModel, tgtView, parameters, this, curView, token);
}
```

  </TabItem>
</Tabs>

#### Navigating to top-level views

If you need to navigate to another top-level view, which would close the current top-level view and will start a new workflow, then you can do it from your view by calling the standard `Navigation.NavigateTo` function as follows.

```cs title="MyView.razor"
protected void NewWorkflow_Click()
{
/* highlight-next-line */
    Navigation.NavigateTo("/TopLevelView");
}
```

## General view structure

A typical structure for a view may contain a header section with a [`ViewTitle`](components#viewtitle) (and an `X` as a *Close* button if it's a child view), followed by the view body and an optional footer. The latter may also contain an explicit *Close* button if it's a child view, as well as a number of other actions or navigation buttons.

The view content can be wrapped in other containers, which may also include its child views, in order to allow opening it in different modes. The following markup demonstrates a generic view structure that allows you to display it either as a top-level view, as an [inline child view](#inline-child-views), or as a [modal popup view](#popup-child-views).

```razor title="SalesOrderView.razor"
@if (Visible)
{
<!-- highlight-next-line -->
<!-- wrappers for displaying the view as a Bootstrap modal dialog -->
<div @ref="MainPanel" class="@UpperClass">
  <div class="@MiddleClass">
<!-- highlight-next-line -->
<!-- container for view content and child views -->
    <div class="d-flex">
      <!-- view content -->
      <div class="@GetViewCol(null) @LowerClass">
<!-- highlight-next-line -->
        <!-- view header with a title and [X] style Close button -->
        <div class="modal-header">
          <h5 class="modal-title">
            <ViewTitle @ref="TitleComponent" Title="@Model?.ViewTitle"></ViewTitle>
          </h5>
          <XActionButton Class="btn-close" NoText="true" OnClick="OnCloseAsync"
                         Action="@VM?.CloseAction"></XActionButton>
        </div>

<!-- highlight-next-line -->
        <!-- main body of the view -->
        <div class="modal-body">[...]

<!-- highlight-next-line -->
        <!-- footer with a Close button, may be hidden in top-level views -->
        <div class="@FooterClass">
            ...
          <XActionButton Action="@VM?.CloseAction" OnClick="OnCloseAsync"></XActionButton>
        </div>
      </div>

<!-- highlight-next-line -->
      <!-- child views -->
      <CustomerListView @ref="cvCustomerListView" Class="@GetViewCol(cvCustomerListView)"></CustomerListView>
      <SalesOrderDetailView @ref="cvSalesOrderDetailView"
                            Class="@GetViewCol(cvSalesOrderDetailView)"></SalesOrderDetailView>
    </div>
  </div>
</div>
}
```

## Dynamic responsive layout

Blazor views in Xomega Framework support responsive layout using the [Bootstrap grid layout system](https://getbootstrap.com/docs/5.2/layout/grid/#responsive-classes), which allows you to arrange your elements in several columns in each row depending on the size of your screen. However, the problem with this approach arises when you have inline child views that can be dynamically opened or closed.

If you provide static Bootstrap classes for elements of a certain view that allow laying them out in a specific way based on the browser screen size, then it may work fine if your view takes up the whole screen. However, if you open that view as an inline child view, it may take only half the width of your screen, and the layout won't work since the screen size for the classes will remain the same.

To overcome this issue, the base `BlazorView` class provides methods to dynamically generate your Bootstrap classes based on the currently open views. All you have to do is specify the maximum number of columns to lay out your elements and, optionally, the desired width of the fields, as described below.

### Laying out fields in a panel

To lay out data fields in a single panel, such that they are arranged using an optimal number of columns, you can set the `row` class on your panel and combine it with the result of the `GetRowCol(maxCol, fldWidth)` function, where the parameters are as follows.
- `maxCol` - the maximum number of columns to lay out fields.
- `fldWidth` - the preferred width of the fields in pixels. If not specified, the value of `DefaultFieldWidth` (150) will be used.

For example, to lay out fields in a maximum of 3 columns with the preferred field size of 100px, you would call `GetRowCol(3, 100)`, which would return something like `row-cols-1 row-cols-sm-3`. Here is what your panel's markup would look like.

```razor
<!-- highlight-next-line -->
<div class="row @GetRowCol(3, 100)">
    <XDataLabel Class="mb-3" Property="@VM?.MainObj?.SalesOrderNumberProperty"></XDataLabel>
    <XDataLabel Class="mb-3" Property="@VM?.MainObj?.OrderDateProperty"></XDataLabel>
    <XSelect Class="mb-3" Property="@VM?.MainObj?.StatusProperty"></XSelect>
    <XCheckBox Class="mb-3" Property="@VM?.MainObj?.OnlineOrderFlagProperty"></XCheckBox>
    <XInputText Class="mb-3" Property="@VM?.MainObj?.PurchaseOrderNumberProperty"></XInputText>
    <XDatePicker Class="mb-3" Property="@VM?.MainObj?.ShipDateProperty"></XDatePicker>
</div>
```

### Laying out panels

Once you have your fields in panels, you may want to lay those out within their parent container in one or more columns. Typically you'd wrap each panel in a `fieldset`, where you can set the title using the `legend` element.

To use Bootstrap grid layout for the panels, you want to set the `row` class on their parent container and then call the `GetPanelCol(maxCol, fldCol, fldWidth)` to set the `col-` class of each fieldset using the following parameters.
- `maxCol` - the maximum number of columns for the parent container.
- `fldCol` - the number of columns used for fields in this view.
- `fldWidth` - the preferred width of the fields in pixels. If not specified, the value of `DefaultFieldWidth` (150) will be used.

The method will return a set of classes for each breakpoint to lay out the panels in an optimal number of columns to honor the preferred width of the fields.

For example, to lay out a panel in no more than two columns, whose fields are laid out in up to 3 columns and have a preferred width of 100px, you would call `GetPanelCol(2, 3, 100)`, which may return something like `col-12 col-md-6 col-lg-12 col-xl-6`, as illustrated by the following markup.

```razor
<!-- highlight-start -->
<div class="row pt-3">
    <fieldset class="@GetPanelCol(2, 2)">
<!-- highlight-end -->
        <legend>@VM?.MainObj?.CustomerObject?.GetTitle()</legend>
        <div class="row @GetRowCol(2)">[...]
    </fieldset>
    <fieldset class="@GetPanelCol(2, 2)">[...]
    <fieldset class="@GetPanelCol(2, 3, 100)">[...]
    <fieldset class="@GetPanelCol(2, 3, 100)">[...]
</div>
```

### Laying out child views

If you use the above methods to set the column classes on your fields and panels, then you need to call the `GetViewCol(null)` to set the column class on the container for your view's main content. If your view also has any inline child views that you want to display side-by-side with the main content, then you should set their column classes by passing the child view to this method, e.g., `GetViewCol(cvSalesOrderView)`.

This method will use the number of currently open inline child views to determine how much horizontal space each view should take for each screen size and whether or not to hide any of the parent views when there is not enough room to show the child view(s), e.g., `col-lg-6 d-none d-lg-flex` and `col-lg-6 col-12`.

For example, when you open a child view on a wide-screen desktop, it may open up on the right side as a master-details view. However, if you reduce the browser size or open it on a tablet, the child view may take up the entire screen, hiding the content of the parent view. Closing the child view will recalculate the column classes to accommodate the remaining open views.

Below is a markup that illustrates the usage of this method.

```razor title="SalesOrderListView.razor"
<div @ref="MainPanel" class="@UpperClass">
  <div class="@MiddleClass">
    <div class="d-flex">
<!-- highlight-start -->
      <div class="@GetViewCol(null) @LowerClass">[...]
      <SalesOrderView @ref="cvSalesOrderView" Class="@GetViewCol(cvSalesOrderView)"></SalesOrderView>
<!-- highlight-end -->
    </div>
  </div>
</div>
```

## Search views

Search views are used to display a list of records in a tabular view based on user-specified or preset criteria. You should subclass your search view from the `BlazorSearchView` base class, and the corresponding view model for your view should inherit from the [`SearchViewModel`](../common-ui/vm/search-view) class.

For user-specified criteria, you can create a special panel with the criteria fields bound to data properties of the view model's [`CriteriaObject`](../common-ui/data-lists#criteria-object), as well as the *Search* and *Reset* buttons bound to the corresponding view model actions. You can bind the panel's `Collapsed` state to the [`CriteriaCollapsed`](../common-ui/vm/search-view#collapsing-criteria) property to let the framework hide the criteria panel when the search is successful or to show it as appropriate.

To display the list of current validation or service errors, you can add the [`Errors`](components#errors) component and bind it to the view model's [`ErrorList`](../common-ui/vm/view-models#error-list). In addition to the main results grid, you can also show a summary of the currently applied criteria using the [`CriteriaBar`](components#criteriabar) component. The following example illustrates a common structure of the search views with the criteria panel on the left side of the results grid.

```razor title="SalesOrderListView.razor"
<div class="modal-body row g-0">
    <div class="col-auto g-0 d-flex">
        <!-- search criteria panel -->
        <Panel Class="me-3" Title="@CriteriaText" @bind-Collapsed="CriteriaCollapsed">
            <div>
                <XActionButton Action="VM?.List?.ResetAction" OnClick="OnResetAsync"></XActionButton>
                <XActionButton Action="VM?.List?.SearchAction" OnClick="OnSearchAsync"
                               IsPrimary="true" Class="float-end"></XActionButton>
            </div>
            <!-- search criteria fields -->
        </Panel>
    </div>
    <div class="col">
        <!-- list of validation or service errors -->
        <Errors Class="mb-3" ErrorList="@Model?.Errors" ViewKey="@Model?.GetResourceKey()"></Errors>

        <!-- summary of currently applied criteria -->
        <CriteriaBar @bind-CriteriaCollapsed="@CriteriaCollapsed"
                    AppliedCriteria="@ListObject?.AppliedCriteria"
                    Title="@CriteriaText" OnRefresh="@OnRefreshAsync"></CriteriaBar>

        <!-- the results grid -->
        <XGrid List="@VM?.ListObj" @bind-CurrentPage="CurrentPage">[...]
    </div>
</div>
<div class="@FooterClass">
    <!-- Select button when the search view is used for selecting a record -->
    <XActionButton Action="@VM?.List?.SelectAction" OnClick="OnSelectAsync" IsPrimary="true"></XActionButton>
    <XActionButton Action="@VM?.CloseAction" OnClick="OnCloseAsync"></XActionButton>
</div>
```

:::note
If your search view is used as a child view for selecting one or more record(s) and returning them to the parent view, then you can enable selection in the results grid and add a *Select* button to the view's footer bound to the [`SelectAction`](../common-ui/vm/search-view#selection-support), as shown above.
:::

### Saving search views

Once you entered the search criteria in your view and hit *Search* to display the results, you may want to be able to save the current search so that you can easily pull it up later without specifying those criteria again.

You can quickly add simple support for saving searches with a new *PermaLink* button, which would take the current criteria and append them to the view's URL. This way, the users can bookmark that URL and then open it whenever they want to pull up the current search view, which would pre-populate the saved criteria.

The base class `BlazorSearchView` provides an `OnPermaLinkAsync` click handler for such a *PermaLink* button, which allows you to add the current criteria to the URL query so that they can be pre-populated when you open it. You can add such a button, for instance, next to the *Refresh* button of the `CriteriaBar`, as illustrated below.

```razor
<div class="d-flex">
    <div class="flex-fill">
        <CriteriaBar @bind-CriteriaCollapsed="@CriteriaCollapsed"
                        AppliedCriteria="@ListObject?.AppliedCriteria"
                        Title="@CriteriaText"
                        OnRefresh="@OnRefreshAsync"></CriteriaBar>
    </div>
<!-- highlight-start -->
    <button type="button" class="ms-2 mb-2 btn btn-outline-secondary btn-sm"
            @onclick="@OnPermaLinkAsync">
        <i class="bi bi-link"></i>
    </button>
<!-- highlight-end -->
</div>
```

:::caution
Note that the bookmarked URLs generated by the base method `OnPermaLinkAsync` only pre-populate the saved criteria, but they **do not run the search automatically**. This allows the users to review and possibly modify the prefilled criteria and then hit *Search*, as opposed to running a potentially costly search automatically and then adjusting the criteria.
:::

If you do want to auto-run the search on that URL and save the user from clicking the *Search* button, then you can just add your own method for handling the *PermaLink* button click and append an action parameter `ViewParams.Action.Search` to the URL as follows.

```razor
    <button type="button" class="ms-2 mb-2 btn btn-outline-secondary btn-sm"
<!-- highlight-next-line -->
            @onclick="@OnPermaLink">
        <i class="bi bi-link"></i>
    </button>
...
@using Microsoft.AspNetCore.WebUtilities
@using Xomega.Framework.Views
@code {
<!-- highlight-next-line -->
    protected void OnPermaLink(MouseEventArgs e)
    {
        if (ListObject?.CriteriaObject == null) return;
        var criteria = ListObject.CriteriaObject.ToNameValueCollection();
        var dict = new Dictionary<string, string>();
        foreach (string key in criteria.Keys) dict[key] = criteria[key];
<!-- highlight-next-line -->
        dict[ViewParams.Action.Param] = ViewParams.Action.Search;
        var uri = new Uri(Navigation.Uri);
        Navigation.NavigateTo(QueryHelpers.AddQueryString(uri.AbsolutePath, dict));
    }
}
```

Finally, you can offer the users both options on the screen, e.g., via a dropdown menu, and let them decide whether or not they want to save a search that will auto-run when open.

## Details views

Details views are used to view and/or edit details of a specific entity and should be extended from the `BlazorDetailsView` base class, while the view model for the view should be a subclass of the [`DetailsViewModel`](../common-ui/vm/details-view). Typically they track changes, show the asterisk next to the title for modified views, prompt for unsaved changes when closing the view, and have a *Save* button that saves any changes.

Details view are usually opened as a child view, so they also have a *Close* button. In addition, you can put additional actions in the view footer (or elsewhere on the view), such as the *Delete* button.

:::tip
Having a *Delete* button on the details view, as compared to deleting entities from a search view, allows the users to review the full details of the entity, which can help them make sure that they don't accidentally delete a wrong entity. There is also a confirmation dialog for the *Delete* action.
:::

The base class `BlazorDetailsView` provides handlers for *Save*, *Delete*, and *Close* buttons, which basically delegate those actions to the bound view model. Following is an example of a footer of a Details view with all of those standard actions.

```razor title="SalesOrderView.razor"
<!-- highlight-next-line -->
@inherits BlazorDetailsView
...
<div class="@FooterClass">
    <XActionButton Action="@VM?.MainObj?.DeleteAction" OnClick="OnDeleteAsync"
                   Class="me-auto"></XActionButton>
<!-- highlight-start -->
    <XActionButton Action="@VM?.MainObj?.SaveAction" OnClick="OnSaveAsync"
                   IsPrimary="true"></XActionButton>
<!-- highlight-end -->
    <XActionButton Action="@VM?.CloseAction" OnClick="OnCloseAsync"></XActionButton>
</div>
...
```

---
sidebar_position: 1
---

# Blazor Views

Generates Bootstrap styled search or details views for both Blazor Server and WebAssembly based on the type of their associated data object.

For list objects it generates a search view with a paged data grid, and a collapsible criteria side panel, which can have flexible search criteria with operators, if there is a corresponding criteria data object defined.

For regular non-list objects it generates a details view with controls and panels for child objects arranged according to the display configuration of those objects, as well as the standard *Save*/*Delete* actions as per the data object's operations.

The generated views extend base classes from the `Xomega.Framework.Blazor` package, and are bound to their corresponding *View Models* that are generated using [View Models Generator](../common/view-models.md).

You can add your customizations to a partial class for the generated view, where you can override any methods from the base class to customize the view actions or certain appearance aspects of the view components.

If you cannot make your customizations programmatically in the partial class, and need to change the generated razor file, then you can mark the layout on such a view as custom in the model, and the view won't be updated when rerunning the generator to preserve your custom changes.

## Generator inputs

The generator uses view definitions in the Xomega model in order to generate the corresponding Blazor views. The view definitions consist of a view model with its associated data object that is also defined in the model, as well as any of its child objects.

### Views

The generator will create search or details views based on whether or not the data object is a list object, as specified by its `list` attribute.

In addition to a unique view `name`, you can specify a `title` for the view, and a `child` attribute, which determines if the view should be added to the main menu. To add custom logic to the generated view you need to set the `customize="true"` attribute on the `ui:view` element, which will create a partial class for the generated view with a *Customized* postfix that will be nested under the view.

The following snippet shows an example of a search view definition in the Xomega model.

```xml
<!-- highlight-next-line -->
<ui:view name="SalesOrderListView" title="Sales Order List" customize="true"
         xmlns:ui="http://www.xomega.net/ui">
  <ui:view-model data-object="SalesOrderList"/>
</ui:view>
```

:::tip
If you need to change the generated Razor markup, you can set a `custom="true"` attribute on the nested `ui:layout` element for the view after generating the view initially, and it won't be updated during subsequent runs of the generator to preserve your changes.
:::

### Controls

The Blazor components that are used for controls on the generated views are determined based on the configuration of the types for the properties of the data objects that the view is based on. The types usually inherit such configurations from their base types, but can override the controls to use as needed.

By default, the base types use Blazor components that are defined in the `Xomega.Framework.Blazor` package and can be bound to Xomega Framework properties.

Read-only fields will be displayed using the `XDataLabel` component, but you can set up different editors for single-value and multi-value properties using custom components that can be property-bound, e.g. inheriting from corresponding Xomega Framework components.

The snippet below shows how to associate a Blazor component with a logical type in the Xomega model.

```xml
<type name="selection">
  <config>
    <ui:blazor-control>
<!-- highlight-next-line -->
      <XSelect />
    </ui:blazor-control>
    <ui:blazor-control multi-value="true">
<!-- highlight-next-line -->
      <XOptions />
    </ui:blazor-control>
  </config>
</type>
```

### Layout

To customize layout of the data object's fields and child objects on the view, you can provide additional configurations in the model under the data object's `ui:display/ui:fields` element.

You can set a custom title for the group of the object's immediate fields here, and also indicate how many columns to use for layout of the fields within the panel using `field-cols` attribute. Similarly you can also set the `panel-cols` attribute to indicate how many columns does the parent panel use to lay out the panel with object's fields along with other panels for the child objects, which you can also configure separately in the `ui:child-panels` element.

For example, with the following configuration, the main panel for the `SalesOrderCustomerObject` will have a panel with the object's direct fields titled '*Customer Info*', and panels for its child objects arranged in two columns based on their `panel-cols` attribute.

```xml
<xfk:data-object class="SalesOrderCustomerObject" customize="true">
  <xfk:add-child name="lookup" class="SalesCustomerLookupObject"/>
  <xfk:add-child name="billing address" class="AddressObject"/>
  <xfk:add-child name="shipping address" class="AddressObject"/>
  <ui:display>
<!-- highlight-next-line -->
    <ui:fields field-cols="2" panel-cols="2" title="Customer Info"/>
    <ui:child-panels>
<!-- highlight-next-line -->
      <ui:panel child="lookup" panel-cols="2" field-cols="2" title="Lookup Customer"/>
      <ui:panel child="billing address" panel-cols="2"/>
      <ui:panel child="shipping address" panel-cols="2"/>
    </ui:child-panels>
  </ui:display>
</xfk:data-object>
```

The '*Customer Info*' and '*Lookup Customer*' panels will also have fields layed out in two columns based on their `field-cols` attribute.

### Fields

For each field inside the `ui:fields` element you can specify whether it is hidden or editable/readonly, and the label or column header to use instead of deriving it from the property's name.

:::note
Note that the labels you specify will not be added directly to the generated markup, but rather to a generated resource file by a separate [Label Resources Generator](../common/resources.md) to allow localization and overrides.
:::

The following snippet demonstrates such a setup.

```xml
<xfk:data-object class="SalesOrderList" list="true" customize="true">
  <ui:display>
    <ui:fields>
      <ui:field param="sales order id" hidden="true"/>
      <ui:field param="online order flag" label="Online"/>
<!-- highlight-next-line -->
      <ui:field param="sales person id" label="Sales Person"/>
      <ui:field param="territory id" label="Sales Territory"/>
    </ui:fields>
  </ui:display>
</xfk:data-object>
```

### Links

The named links to other views, which are defined on the view's data objects in the model, will be generated either as standalone links using their name or title as text, or, if the link is supposed to be on each row of a list object, it will be displayed on the field specified in the link's `ui:display` element, as shown below.

```xml
<xfk:data-object class="SalesOrderList" list="true">
  <ui:link name="details" view="SalesOrderView" child="true" mode="inline">
    <ui:params>
      <ui:param name="sales order id" field="sales order id"/>
    </ui:params>
<!-- highlight-next-line -->
    <ui:display on-field="sales order number" on-selection="true"/>
  </ui:link>
  <ui:link name="new" view="SalesOrderView" child="true" mode="inline">
    <ui:params>
      <ui:param name="_action" value="create"/>
    </ui:params>
    <ui:display title="New Order" access-key="N"/>
  </ui:link>
</xfk:data-object>
```

When a link has a `child="true"` attribute, the target view will be opened in a popup dialog, or in a separate details panel based on the link's `mode` attribute. Otherwise, the view will be opened in a new page.

:::note
Most of this setup for standard details and search views in the Xomega model can be easily added automatically by a special [model enhancement CRUD generator](../../model/crud.md).
:::

### Grid customization

For each list data object you can specify custom settings for the generated grids at the end under the `blazor-controls` element, as shown below.

```xml
<xfk:data-object class="SalesOrderList" list="true">
  ...
<!-- highlight-start -->
  <ui:blazor-controls>
    <ui:XGrid PageSizes="new [] {10, 20, 50}" PagesToShow="9" AllowSorting="true"/>
  </ui:blazor-controls>
<!-- highlight-end -->
</xfk:data-object>
```

## Generator outputs

This generator creates Razor files for the views with C# code-behind classes, and optionally a static class for the main menu structure based on the views that are not marked with a `child` attribute grouped by module.

For views that are decorated with a `customize="true"` attribute, it also creates a partial class for the generated view with a postfix *Customized* appended to the class name, if one does not exist yet. The customized classes will be nested under the corresponding generated view Razor file, according to the rules specified in the `.filenesting.json` file for the target client project.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Blazor Views|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Presentation Layer\Blazor|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Client.Blazor.Common /Views/{Module/}{File}|Relative path where to output files with generated Views. The path must contain a {File} placeholder to output files by view, and may contain a {Module/} placeholder to also group the views by module.|
|Custom Path||Relative path where to output custom partial classes for the generated views. If not set, then the *OutputPath* will be used. The path must contain a {File} placeholder to output files by view.|
|Menu File|../MySolution.Client.Blazor.Common /Views/MainMenu.cs|Output path to the C# file where to generate static structure for the main menu.|
|**Parameters**|
|Namespace|MySolution.Client.Blazor.Views.Common|Namespace for the generated views.|
|**Selector**|
|View||The name of the view from the model to generate a view for. Can be used to set up a separate generator configuration for a single view.|

### Model configuration

Additional configuration used by the generator is specified in the Xomega model under the top level `config` element, which is conventionally placed in the `global_config.xom` file.

The default grid configuration for all generated grids that don't have an override on the data object level is specified under the `ui:controls-config/ui:blazor-controls` element, where you can set attributes for the `XGrid` control from the `Xomega.Framework.Blazor` package, as shown below.

```xml title="global_config.xom"
<ui:controls-config>
  <ui:blazor-controls>
<!-- highlight-next-line -->
    <ui:XGrid PageSizes="new [] {10, 20, 50}" PagesToShow="9" AllowSorting="true"/>
  </ui:blazor-controls>
</ui:controls-config>
```

### Common configurations

Normally, there expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

:::tip
When you are working on a specific view though, you can also copy the default configuration, and set that view as the selector, so that you could easily regenerate just that view instead of all the views.
:::

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for all the views in the model, or for a specific view that is specified in the generator's parameter.

You can rerun the generator when you change the data objects for the views, or UI configuration of their properties, and also when you change any other configurations that the views depend upon, such as links, layout, fields' settings, etc.

:::note
This generator should be included in the build of the model project in the configuration, in order to allow to easily regenerate all views along with other artifacts.
:::

### Customizing the output

:::danger
You should not edit generated markup or code behind for the views directly, if you would like to re-run the generator later without losing your changes, unless you specifically enabled custom layout for your view.
:::

To add your customizations, you need to edit a partial class for the generated view that was added when you specified the `customize` attribute on the view. In that partial class you can override any methods from the base class to customize the view actions or certain appearance aspects of the view components, such as text and visibility for the action buttons.

:::info
Unlike WPF views or WebForms, you generally should not manipulate the Blazor components directly, but rather update the underlying data they are bound to.
:::

:::tip
If you do need to change the markup for the view, you can set the `custom="true"` attribute on the view's `ui:layout` element after generating that view initially, and it won't be updated during subsequent runs of the generator.

In this case you may as well delete the view from the model after initial generation, unless you need it there for link references from other objects.
:::

### Cleaning generator’s output

This generator supports cleaning all generated views using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator. Also, it can be used as part of *Regenerate* action, which runs the *Clean* and then *Generate* actions, when you have removed some of the views from the model, and want the generated classes and files deleted and removed from the target project.
:::

:::caution
Note, that the customization partial classes that were generated for views with a `customize="true"` attribute will not be cleaned during these operations to prevent any loss of custom code during accidental run of such actions. Therefore, you may get compilation errors for those classes if you clean your views, and will need to delete them manually as needed.
:::
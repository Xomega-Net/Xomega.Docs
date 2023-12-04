---
sidebar_position: 1
---

# SPA Views

Generates search or details views for HTML5 Single Page Applications based on the type of their associated data object.

For list objects, it generates a search view with a paged data grid, and a collapsible criteria panel, which can have flexible search criteria with operators, if there is a corresponding criteria data object defined.

For regular non-list objects, it generates a details view with controls and panels for child objects arranged using the specified layout, as well as the standard *Save*/*Delete* actions as per the data object's operations.

The generated TypeScript view models extend from `XomegaJS` base classes for search and details views.

You can add your customizations to a subclass of the generated view model, where you can programmatically update any generated HTML controls using JQuery, and implement any additional view logic.

If you cannot make your customizations programmatically in the custom view model subclass and need to change the generated HTML markup, then you can mark the layout on such a view as custom in the model, and the view won't be updated when rerunning the generator to preserve your custom changes.

## Generator inputs

The generator uses view definitions in the Xomega model to generate the corresponding SPA views. The view definitions consist of a view model with its associated data object that is also defined in the model, and optionally a layout specification, which can reference an existing layout configuration, and/or provide custom layout settings.

### Views

The generator will create search or details views based on whether or not the data object is a list object, as specified by its `list` attribute.

In addition to a unique view name, you can specify a title for the view, and a `child` attribute, which determines if the view should be added to the main menu.

To add custom logic to the generated view you need to set the `customize="true"` attribute on the `ui:view` element, which will create and use a subclass of the generated view model class with a *Customized* postfix.

The following snippet shows an example of a search view definition in the Xomega model.

```xml
<ui:view name="SalesOrderListView" title="Sales Order List" customize="true"
         xmlns:ui="http://www.xomega.net/ui">
  <ui:view-model data-object="SalesOrderList"/>
  <ui:layout base="master-details"/>
</ui:view>
```

:::tip
If you need to change the HTML markup, you can set a `custom="true"` attribute on the nested `ui:layout` element for the view after generating the view initially, and it won't be updated during subsequent runs of the generator to preserve your changes.
:::

### Controls

The HTML controls that are used on the generated views are determined based on the configuration of the types for the properties of the data objects that the view is based on. The types usually inherit such configurations from their base types but can override the controls to use as needed.

Read-only fields will use a standard span element, but you can set up different editors for single-value and multi-value properties using standard HTML controls with any custom attributes, as illustrated below.

```xml
<type name="enumeration" base="code">
  <config>
    <ui:html-control>
<!-- highlight-next-line -->
      <select xmlns="http://www.w3.org/1999/xhtml"/>
    </ui:html-control>
    <ui:html-control multi-value="true">
<!-- highlight-next-line -->
      <select multiple="multiple" xmlns="http://www.w3.org/1999/xhtml"/>
    </ui:html-control>
  </config>
</type>
<type name="boolean">
  <config>
    <ui:html-control>
<!-- highlight-next-line -->
      <input class="boolean" type="checkbox" xmlns="http://www.w3.org/1999/xhtml"/>
    </ui:html-control>
  </config>
</type>
```

XomegaJS framework allows you to extend its standard Knockout-based property bindings to dynamically generate any control from the field's element in runtime, and bind it to the data property.

### Fields

To customize the display of the data object's fields on the view, you can provide additional configurations in the model under the data object's `ui:display` element.

For each field, you can specify whether it is hidden or editable/read-only, and the label or column header to use instead of deriving it from the property's name. The following snippet demonstrates such a setup.

```xml
<xfk:data-object class="SalesOrderList" list="true" customize="true">
  <ui:display>
    <ui:fields>
<!-- highlight-start -->
      <ui:field param="sales order id" hidden="true"/>
      <ui:field param="online order flag" label="Online"/>
      <ui:field param="sales person id" label="Sales Person"/>
      <ui:field param="territory id" label="Sales Territory"/>
<!-- highlight-end -->
    </ui:fields>
  </ui:display>
</xfk:data-object>
```

### Links

The named links to other views, which are defined on the view's data objects in the model, will be generated either as standalone links using their name as text, or, if the link is supposed to be on each row of a list object, it will be displayed on the field specified in the link's `ui:display` element, as shown below.

```xml
<xfk:data-object class="SalesOrderList" list="true" customize="true">
  <ui:link name="details" view="SalesOrderView" child="true">
    <ui:params>
      <ui:param name="sales order id" field="sales order id"/>
    </ui:params>
<!-- highlight-next-line -->
    <ui:display on-field="sales order number"/>
  </ui:link>
</xfk:data-object>
```

When a link has a `child="true"` attribute, the target view will be opened in a popup dialog, or separate details split panel if the link is on a search view with a master-details layout. Otherwise, the view will be opened as a new page.

:::note
Most of this setup for standard details and search views in the Xomega model can be easily added automatically by a special [model enhancement CRUD generator](../../model/crud).
:::

## Generator outputs

This generator creates SPA views with HTML markup and a TypeScript view model class and registers their paths with the RequireJS configuration in the specified *Registry File*.

If the view is not marked with a `child` attribute, it will also be added to the specified *Menu File* with Durandal routes registration, so that it could be displayed in the main menu.

The generator also adds all the generated files to the specified SPA project as needed.

For views that are decorated with a `customize="true"` attribute, it also creates a subclass of the generated view model class with a postfix *Customized* appended to the class name if one does not exist yet. It will use this subclass in the RequireJS configuration for that view, and can also nest the customized class under the generated view in the project if so configured.

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|SPA Views|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Presentation Layer\SPA|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Client.Spa /Views/\{Module/\}\{File\}|Relative path where to output files with generated Views. The path must contain a \{File\} placeholder to output files by view, and may contain a \{Module/\} placeholder to also group the views by module.|
|Custom Path||Relative path where to output override classes for the generated views. If not set, then the *OutputPath* will be used. The path must contain a \{File\} placeholder to output files by view.|
|Nest Custom File|True|Whether or not to nest custom code-behind file under the auto-generated base file in the project. Applies only if both files are output to the same directory.|
|Add To Project|../MySolution.Client.Spa /MySolution.Client.Spa.csproj|Relative path to the project file to add the generated files to. The project will be reloaded every time you run the generator. Leave it blank if you don't want generated files to be added to your project automatically.|
|Registry File|../MySolution.Client.Spa /Views/ViewsConfig.ts|Relative path to the file for view paths registration.|
|Menu File|../MySolution.Client.Spa /Views/MainMenu.ts|Relative path to the file for view routes registration.|
|**Selector**|
|View||The name of the view from the model to generate a view for. Can be used to set up a separate generator configuration for a single view.|

### Model configuration

Additional configuration used by the generator is specified in the Xomega model under the top-level `config` element, which is conventionally placed in the `global_config.xom` file.

The global configuration contains named layout configurations that are referenced in the individual views, which are specified under the `ui:layout-config` element, as shown below.

```xml title="global_config.xom"
<ui:layout-config>
<!-- highlight-next-line -->
  <ui:layout name="standard" default="true">
    <ui:list details-mode="popup">
      <ui:criteria>
        <ui:fields columns="2" flow="vertical"/>
      </ui:criteria>
    </ui:list>
    <ui:details>
      <ui:fields columns="2" flow="vertical"/>
      <ui:children layout="tabs"/>
    </ui:details>
    <ui:description>Standard layout for list view with popup details</ui:description>
  </ui:layout>
<!-- highlight-next-line -->
  <ui:layout name="master-details" base="standard">
    <ui:list details-mode="inline"/>
    <ui:description>Display of list view with a side details panel</ui:description>
  </ui:layout>
</ui:layout-config>
```

### Common configurations

Normally, there is expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

:::tip
When you are working on a specific view though, you can also copy the default configuration, and set that view as the selector, so that you could easily regenerate just that view instead of all the views.
:::

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for all the views in the model, or for a specific view that is specified in the generator's parameter.

You can rerun the generator when you change the data objects for the views, or the UI configuration of their properties, and also when you change any other configurations that the views depend upon, such as links, layout, fields' settings, etc.

:::note
This generator should be included in the build of the model project in the configuration, in order to allow to easily regenerate all views along with other artifacts.
:::

### Customizing the output

:::danger
You should not edit generated markup or code behind for the views directly if you would like to re-run the generator later without losing your changes unless you specifically enabled a custom layout for your view.
:::

To add your customizations, you need to edit a subclass of the generated view model class for the view that was added when you specified the `customize` attribute on the view. In that subclass, you will have access to the view's HTML controls via JQuery, and can programmatically change them or add custom behaviors.

:::tip
If you do need to change the markup for the view, you can set the `custom="true"` attribute on the view's `ui:layout` element after generating that view initially, and it won't be updated during subsequent runs of the generator.

In this case, you may as well delete the view from the model after the initial generation unless you need it there for link references from other objects.
:::

### Cleaning the generator’s output

This generator supports cleaning all generated views using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the views from the model, and want the generated classes and files deleted and removed from the target project.
:::

:::warning
Note, that the customization subclasses that were generated for views with a `customize="true"` attribute will not be cleaned during these operations to prevent any loss of custom code during an accidental run of such actions. Therefore, you may get compilation errors for those classes if you clean your views, and will need to delete them manually as needed.
:::
# ASP.NET Views

Generates search or details views for ASP.NET WebForms based on the type of their associated data object.

For list objects it generates a search view with a paged data grid, and a collapsible criteria panel, which can have flexible search criteria with operators, if there is a corresponding criteria data object defined.

For regular non-list objects it generates a details view with controls and panels for child objects arranged using the specified layout, as well as the standard *Save*/*Delete* actions as per the data object's operations.

The generated views extend base classes from the `Xomega.Framework.Web` package, and are bound to their corresponding View Models that are generated using [View Models Generator](../common/view-models).

You can add your customizations to a subclass of the generated code-behind class for the view, where you can programmatically update any generated server controls, and implement any additional ASP.NET-specific view logic.

If you cannot make your customizations programmatically in the custom code-behind subclass, and need to change the generated ASP.NET markup, then you can mark the layout on such a view as custom in the model, and the view won't be updated when rerunning the generator to preserve your custom changes.

## Generator inputs

The generator uses view definitions in the Xomega model in order to generate the corresponding ASP.NET views. The view definitions consist of a view model with its associated data object that is also defined in the model, and optionally a layout specification, which can reference an existing layout configuration, and/or provide custom layout settings.

### Views

The generator will create search or details views based on whether or not the data object is a list object, as specified by its `list` attribute.

In addition to a unique view name, you can specify a title for the view, and a `child` attribute, which determines if the view should be added to the main menu.

To add custom logic to the generated view you need to set the `customize="true"` attribute on the `ui:view` element, which will create and use a subclass of the generated code-behind class with a *Customized* postfix.

The following snippet shows an example of a search view definition in the Xomega model.

```xml
<ui:view name="SalesOrderListView" title="Sales Order List" customize="true"
         xmlns:ui="http://www.xomega.net/ui">
  <ui:view-model data-object="SalesOrderList"/>
  <ui:layout base="master-details"/>
</ui:view>
```

:::tip
If you need to change the ASP.NET markup, you can set a `custom="true"` attribute on the nested `ui:layout` element for the view after generating the view initially, and it won't be updated during subsequent runs of the generator to preserve your changes.
:::

### Controls

The ASP.NET controls that are used on the generated views are determined based on the configuration of the types for the properties of the data objects that the view is based on. The types usually inherit such configurations from their base types, but can override the controls to use as needed.

Read-only fields will use a standard label control, but you can set up different editors for single-value and multi-value properties using either standard ASP.NET controls, or custom controls, as illustrated below.

```xml
<type name="enumeration" base="code" xmlns:asp="clr-namespace:System.Web.UI.WebControls;assembly=System.Web">
  <config>
    <ui:web-control>
<!-- highlight-next-line -->
      <asp:DropDownList runat="server"/>
    </ui:web-control>
    <ui:web-control multi-value="true">
<!-- highlight-next-line -->
      <asp:ListBox runat="server"/>
    </ui:web-control>
  </config>
</type>
<type name="date time" xmlns:uc="UserControl">
  <config>
    <ui:web-control>
<!-- highlight-next-line -->
      <uc:DateTimeControl TextCssClass="datetime" runat="server"/>
    </ui:web-control>
  </config>
</type>
```

### Fields

To customize display of the data object's fields on the view, you can provide additional configurations in the model under the data object's `ui:display` element.

For each field you can specify whether it is hidden or editable/readonly, the label or column header to use instead of deriving it from the property's name, and also whether a change in that field triggers updates in other fields, which sets the `AutoPostBack` attribute on the generated control.

The following snippet demonstrates such a setup.

```xml
<xfk:data-object class="SalesOrderList" list="true" customize="true">
  <ui:display>
    <ui:fields>
      <ui:field param="sales order id" hidden="true"/>
<!-- highlight-next-line -->
      <ui:field param="online order flag" label="Online" is-trigger="true"/>
      <ui:field param="sales person id" label="Sales Person"/>
      <ui:field param="territory id" label="Sales Territory"/>
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

When a link has a `child="true"` attribute, the target view will be opened in a popup dialog, or in a separate details split-panel, if the link is on a search view with a master-details layout. Otherwise, the view will be opened as a new page.

:::note
Most of this setup for standard details and search views in the Xomega model can be easily added automatically by a special [model enhancement CRUD generator](../../model/crud).
:::

## Generator outputs

This generator creates user controls for the views with ASCX markup and a C# code-behind class, so that you could easily embed the view into another view. It also generates an ASPX page for the view to allow for showing the view as a standalone page.

If the view is not marked with a `child` attribute, it will also be added to the specified `Web.sitemap` file, so that it could be displayed in the main menu. The generator also adds all the generated files to the specified web project as needed.

For views that are decorated with a `customize="true"` attribute, it also creates a subclass of the generated code-behind class with a postfix *Customized* appended to the class name, if one does not exist yet. It will use this subclass in the ASCX markup, and can also nest the customized class under the generated view in the project, if so configured.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|ASP.NET Views|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Presentation Layer\Web Forms|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Client.Web /Views/{Module/}{File}|Relative path where to output files with generated Views. The path must contain a {File} placeholder to output files by view, and may contain a {Module/} placeholder to also group the views by module.|
|Custom Path||Relative path where to output override classes for the generated code-behind. If not set, then the *OutputPath* will be used. The path must contain a {File} placeholder to output files by view.|
|Nest Custom File|True|Whether or not to nest custom code-behind file under the auto-generated base file in the project. Applies only if both files are output to the same directory.|
|Add To Project|../MySolution.Client.Web /MySolution.Client.Web.csproj|Relative path to the project file to add the generated files to. The project will be reloaded every time you run the generator. Leave it blank if you don't want generated files to be added to your project automatically.|
|Menu File|../MySolution.Client.Web /Web.sitemap|Relative path to the sitemap file to add views to for the main menu.|
|**Parameters**|
|Namespace|MySolution.Client.Web|Namespace for the generated pages and views.|
|**Selector**|
|View||The name of the view from the model to generate a view for. Can be used to set up a separate generator configuration for a single view.|

### Model configuration

Additional configuration used by the generator is specified in the Xomega model under the top level `config` element, which is conventionally placed in the `global_config.xom` file.

The paths to the master page and the user controls that are used by the generator, or configured for the types that are used by properties of the view's data objects, are specified under the `ui:controls-config/ui:user-controls` element of the global configuration, as follows.

```xml title="global_config.xom"
<ui:controls-config>
  <ui:user-controls>
    <ui:user-control name="AppliedCriteria" path="Controls/AppliedCriteria"/>
    <ui:user-control name="CollapsiblePanel" path="Controls/CollapsiblePanel"/>
    <ui:user-control name="DateTimeControl" path="Controls/Editors/DateTimeControl"/>
    <ui:user-control name="PickListControl" path="Controls/Editors/PickListControl"/>
    <ui:user-control name="Errors" path="Controls/Errors"/>
<!-- highlight-next-line -->
    <ui:user-control name="ViewTemplate" path="Site.Master"/>
  </ui:user-controls>
</ui:controls-config>
```

The global configuration contains named layout configurations that are referenced in the individual views, which are specified under the `ui:layout-config` element, as shown below.

```xml
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

To add your customizations, you need to edit a subclass of the generated code behind class for the view that was added when you specified the `customize` attribute on the view. In that subclass you will have access to most of the server-side controls for the view, and can programmatically change them or add custom behaviors.

:::tip
If you do need to change the markup for the view, you can set the `custom="true"` attribute on the view's `ui:layout` element after generating that view initially, and it won't be updated during subsequent runs of the generator.

In this case you may as well delete the view from the model after initial generation, unless you need it there for link references from other objects.
:::

### Cleaning generator’s output

This generator supports cleaning all generated views using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the views from the model, and want the generated classes and files deleted and removed from the target project.
:::

:::caution
Note, that the customization subclasses that were generated for views with a `customize="true"` attribute will not be cleaned during these operations to prevent any loss of custom code during accidental run of such actions. Therefore, you may get compilation errors for those classes if you clean your views, and will need to delete them manually as needed.
:::
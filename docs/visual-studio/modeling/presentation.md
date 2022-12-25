---
sidebar_position: 5
---

# Presentation Model

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Xomega presentation model describes UI views, their view models, and the underlying presentation data objects that they are composed of. All these presentation model entities have corresponding supporting classes in the Xomega Framework, which powers the application generated from the model.

The unique feature of Xomega modeling is that you build your presentation model on top of the structure of your service model, which not only eliminates the need for you to manually build out the elements of your views and view models, but it also automatically ties your views to the corresponding service operations, and therefore allows Xomega to generate a fully functional application with minimal effort.

The views that you define in the presentation model can be used in your application both as individual screens or as building blocks for more complex screens and workflows.

## Data objects

Xomega Framework data objects serve as data models for some parts of your view, such as a panel or a data grid, which get bound to the data object and its properties. This means that any changes in the data properties, including their states, such as visibility or editability, get automatically reflected in the bound UI controls, and any updates that you make in the editable bound controls are automatically applied to the data properties.

Data objects can contain other child objects, which is typically mirrored on the UI, where a panel bound to the parent object contains sub-panels or data grids bound to its child objects. This allows you to build out the general structure of your UI view by defining composable parent and child data objects.

You can declare data objects in your model using `xfk:data-object` element under the `xfk:data-objects` node, which should go at the end of the top-level `module` element. You must set the `class` attribute to a unique class for the data object and set the `list="true"` for list objects that represent tabular data and are typically bound to a data grid.

If you want to use a custom subclass of the generated data object, where you can override methods and add functionality, then you can add a `customize="true"` attribute to the data object declaration, and Xomega will create such a custom subclass for you, which will be preserved whenever you regenerate data objects.

The following snippet illustrates declarations of data objects, as well as their possible content elements, which should follow the order they are listed here.

```xml
<module xmlns="http://www.xomega.net/omodel"
        xmlns:ui="http://www.xomega.net/ui"
        xmlns:xfk="http://www.xomega.net/framework">
  ...
  <xfk:data-objects>
<!-- highlight-start -->
    <xfk:data-object class="MyList" list="true"/>
    <xfk:data-object class="MyObject" customize="true">
<!-- highlight-end -->
      <xfk:summary>[...] <!-- optional description of the data object -->

      <!-- an array of child data objects, if any -->
      <xfk:add-child name="child" class="ChildObject"/>
      <xfk:add-child name="list" class="ChildList"/>
      
      <ui:display>[...]  <!-- configuration of the UI display of the object -->
      
      <!-- an array of object links to other views, if any -->
      <ui:link name="view1" view="SomeView" child="true" mode="popup">[...]
      <ui:link name="view2" view="AnotherView" child="true" mode="inline">[...]
      
      [...] <!-- UI framework-specific configuration of some UI controls for the object -->

    </xfk:data-object>
  </xfk:data-objects>
</module>
```

If you declare a new data object, as illustrated in the snippet above, the Xomega model will show you a warning that your data object doesn't have any properties. However, you may have noticed that the definition of a data object in the model doesn't really support the ability to list its data properties explicitly. Instead, those are included in the data object implicitly based on your service model, as explained below.

### Data object properties

To add data properties to a data object, you need to pick one or more structures defined in the model and add `xfk:add-to-object` config element to it, where you set the `class` attribute to the class of your data object, as follows.

```xml
<struct name="customer info" object="customer">
<!-- highlight-start -->
  <param name="customer id"/>
  <param name="store id"/>
  <param name="store name" type="string" required="false"/>
  <param name="person id"/>
  <param name="person name" type="string" required="false"/>
  <param name="account number"/>
  <param name="territory id"/>
<!-- highlight-end -->
  <struct name="billing address" ref="address key"/>
  <struct name="shipping address" ref="address key"/>
  <config>
<!-- highlight-next-line -->
    <xfk:add-to-object class="SalesOrderCustomerObject"/>
  </config>
</struct>
```

This will add all `param` elements of the structure as data properties of your data object. Any inline `struct` elements though, such as the `billing address` and `shipping address` from the above example, will not be included in the data object.

:::info
The structure element that you add to your data object can be defined anywhere in the model, including standalone structures, nested inline structures, or input/output structures of your service operations.
:::

The specific class of each data property will be determined by the `xfk:property` configuration of the parameter's logical type or inherited from its base types, as follows.

```xml
<type name="enumeration" base="selection" size="25">
  <config>
    <sql:type name="nchar" db="sqlsrv"/>
    <clr:type name="string"/>
<!-- highlight-next-line -->
    <xfk:property class="EnumProperty" namespace="Xomega.Framework.Properties" tsModule="xomega"/>
  </config>
</type>
```

As mentioned before, you can add properties to a data object from multiple various structures that are defined in your service model. Parameters with the same name in different structures would correspond to the same property, which means that they should map to the same property class and must have consistent `list` attributes that indicate if this is a multi-value property.

:::caution
**You won't get model validation errors** if parameters with the same name in different structures are added to the same object but map to different property classes or have inconsistent `list` attributes. Instead, you will only get the errors when you run the [Xomega Data Objects generator](../../generators/presentation/common/data-objects).
:::

### Data object operations

In addition to adding properties to the data object, specifying `xfk:add-to-object` inside inline operation structures or in any structures referenced by the operation structures tells Xomega about the service operations that the data object is involved in so that the generated data objects could include methods that call the corresponding service operations.

When calling the service operation, such a method first populates its input structure with the values of the data object's properties that map to the corresponding input parameters, then calls the service, and finally populates the data properties (or the entire list object) from the output of the service call, if it's mapped to that object.

For example, let's consider a typical `update` operation for a `sales order` object, where the input parameters consist of the `sales order id`, which will be part of the URI path when called via REST API, and a separate `data` structure that will be passed in the body of the REST request.

In order to make sure that **all** input parameters are populated with the values of the data object's properties, you need to add the `xfk:add-to-object` config element to **both** the `input` element and the nested `<struct name="data">` element, as follows.

```xml
<operation name="update" type="update">
<!-- highlight-next-line -->
  <input>
    <param name="sales order id"/>
<!-- highlight-next-line -->
    <struct name="data">
      <param name="status"/>
      <param name="purchase order number"/>
      <param name="comment"/>
      <config>
<!-- highlight-next-line -->
        <xfk:add-to-object class="SalesOrderObject"/>
      </config>
    </struct>
    <config>
<!-- highlight-next-line -->
      <xfk:add-to-object class="SalesOrderObject"/>
    </config>
  </input>
  <output>[...]
  <config>
<!-- highlight-next-line -->
    <rest:method verb="PUT" uri-template="sales-order/{sales order id}"/>
  </config>
</operation>
```

The `update` method may internally update the sales order's `revision number` and `modified date` and return them as output parameters. To make sure those sales order properties get populated with the new values, you also need to add the `xfk:add-to-object` config to the `output` structure, as follows.

```xml
<operation name="update" type="update">
  <input>[...]
<!-- highlight-next-line -->
  <output>
    <param name="revision number"/>
    <param name="modified date"/>
    <config>
<!-- highlight-next-line -->
      <xfk:add-to-object class="SalesOrderObject"/>
    </config>
  </output>
  <config>[...]
</operation>
```

When you set the proper `type` attribute on your operations, the generated data object can use it to implement the standard CRUD methods on the base data object, which will, in turn, allow Xomega Framework to take care of the standard supported actions on your views, such as *Search*, *Save*, *Delete*, etc.

Also, by adding input and output structures to your data objects, you will ensure that your data object will automatically have all the necessary data properties to supply the input for the operation, store the output of that operation, or both. If you later need to add any input or output parameters to your service operation, then your data object will be automatically adjusted to accommodate those.

Moreover, based on which structures you add to your data object, Xomega can infer how each property should be used. For example, if a data property maps only to output parameters, and has no corresponding input parameters, then it will be considered read-only, and Xomega will use a display-only control, such as a data label, in order to show that property on the view.

### Child data objects

Your standard view will typically have one main data object, but any panels, tabs, or data grids on your view can be modeled as child data objects of the main object. In addition to providing a visual hierarchy, child data objects participate in the main object's lifecycle. For example, validating the main object involves recursive validation of all its child objects and properties. Similarly, the modification state of the main object depends on the modification states of its child objects and properties.

You can declare child data objects and add them as children of their parent object as part of the parent object's declaration using the `xfk:add-child` element. The name of the child that you specify in the `name` attribute should be unique within its parent object.

The following example shows a `SalesOrderObject` that has a child `customer` object, as well as a child list `line items`.

```xml
<xfk:data-objects>
  <xfk:data-object class="SalesOrderObject">
<!-- highlight-start -->
    <xfk:add-child name="customer" class="SalesOrderCustomerObject"/>
    <xfk:add-child name="line items" class="SalesOrderLineItemList"/>
<!-- highlight-end -->
  </xfk:data-object>
<!-- highlight-start -->
  <xfk:data-object class="SalesOrderCustomerObject"/>
  <xfk:data-object class="SalesOrderLineItemList" list="true"/>
<!-- highlight-end -->
</xfk:data-objects>
```

Now, as far as mapping these objects to your service model, you can read the data for the entire `SalesOrderObject` and all its child objects in one single service operation, or you can read the child objects or even some parts of the parent object in separate service operations. You can also mix and match, with some child objects read together with their parent, while others read in separate operations. Xomega Framework also allows reading the data from multiple operations in parallel to speed it up.

Service operations to update the sales order data can also be structured in a variety of ways depending on your requirements for the view. If you have a standard *Save* button for the entire view, then the best option may be to have a single update operation that saves everything in one transaction, as opposed to multiple update operations that may lead to an inconsistent state if some operations fail while others succeed. If, however, your view allows partial saves, then you can implement separate update operations accordingly.

If you read or update the child object together with the parent object in the same operation, then the easiest way to ensure that the child object properties will be populated from the output or that the data from the child object will make it into the input of the operation is to add a nested `struct` parameter to the output or input of the parent's operation and **use the name of the child object** for that parameter.

For example, assuming that the `customer info` structure from the [previous example](#data-object-properties) is added to the `SalesOrderCustomerObject`, if you want to read the customer information together with the sales order data, then you will need to add a `struct` parameter with `name="customer"` to the output of the `read` operation, as follows.

```xml
<operation name="read" type="read">
  <input>
    <param name="sales order id"/>
    <config>
<!-- highlight-next-line -->
      <xfk:add-to-object class="SalesOrderObject"/>
    </config>
  </input>
  <output>
    <param name="sales order number"/>
    <param name="order date" type="date"/>
    <param name="status"/>
    <param name="purchase order number"/>
    <param name="account number"/>
<!-- highlight-next-line -->
    <struct name="customer" ref="customer info"/>
    <param name="comment"/>
    <param name="revision number"/>
    <param name="modified date"/>
    <config>
<!-- highlight-next-line -->
      <xfk:add-to-object class="SalesOrderObject"/>
    </config>
  </output>
</operation>
```

:::note
If the nested structure does not map to a child object with the same name, then Xomega will show you a warning telling you that this structure cannot be automatically handled by the generated data object. If you plan to handle it manually in a subclass of the generated data object, then you can add a `<xfk:handling custom="true"/>` config element to that parameter to suppress that warning, as follows.

```xml
<!-- highlight-next-line -->
<struct name="customer data" ref="customer info">
  <config>
<!-- highlight-next-line -->
    <xfk:handling custom="true"/>
  </config>
</struct>
```
:::

## Data object display

The UI display of a data object in the generated views will be based on its structure. This means that the UI fields bound to the data object properties will appear on the screen in the same order that the corresponding data object parameters are first listed in the model.

For example, if the **first structure** that you add to your data object in the model file is an output structure of a `read` operation, and it returns all of the fields that you display on the screen, then you can just list those output parameters in the same order as you want them to be shown on the screen. This is a typical and the most common scenario.

:::tip
If for some reason you cannot change the order of your operation parameters, or if parameters are added to the object from different structures, and you cannot coordinate the order of the combined parameters, then you can try to define a special auxiliary structure before all of the other structures for that object, and then add the required parameters to it using the desired order, and specify the `xfk:add-to-object` configuration for your object there.

If you don't use that structure in any operation or another structure, then you may want to also [mark it as generic](services#generic-structures).
:::

The child data objects will be shown as nested panels or tabs on the screen, which will go in the order that you list them under the data object declaration.

You can further configure various display options for your fields and panels in the presentation model, as described below.

### UI controls

The UI controls to display or edit a data property for each specific UI framework will be determined based on the UI control configuration of the parameter's logical type for that UI framework unless the data property is not editable, in which case the default display-only control will be used.

If the data property allows multiple values, then Xomega will try to use a control with a `multi-value="true"` attribute if one is available. The following examples demonstrate [split configurations](types#split-configurations) of UI controls for the logical type `selection` for various UI frameworks.

<Tabs>
  <TabItem value="blazor-control" label="Xomega Blazor">

```xml
<type-config type="selection">
  <ui:blazor-control>
<!-- highlight-next-line -->
    <XSelect />
  </ui:blazor-control>
  <ui:blazor-control multi-value="true">
<!-- highlight-next-line -->
    <XPickList />
  </ui:blazor-control>
</type-config>
```

  </TabItem>
  <TabItem value="sf-blazor-control" label="Syncfusion Blazor">

```xml
<type-config type="selection">
  <ui:sf-blazor-control>
<!-- highlight-next-line -->
    <XSfDropDownList />
  </ui:sf-blazor-control>
  <ui:sf-blazor-control multi-value="true">
<!-- highlight-next-line -->
    <XSfMultiSelect />
  </ui:sf-blazor-control>
</type-config>
```

  </TabItem>
  <TabItem value="web-control" label="Web Forms">

```xml
<type-config type="selection" xmlns:asp="clr-namespace:System.Web.UI.WebControls;assembly=System.Web">
  <ui:web-control>
<!-- highlight-next-line -->
    <asp:DropDownList runat="server" />
  </ui:web-control>
  <ui:web-control multi-value="true">
<!-- highlight-next-line -->
    <asp:ListBox runat="server" />
  </ui:web-control>
</type-config>
```

  </TabItem>
  <TabItem value="wpf-control" label="WPF">

```xml
<type-config type="selection">
  <ui:control>
<!-- highlight-start -->
    <ComboBox Style="{StaticResource ControlStyle}"
              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"/>
<!-- highlight-end -->
  </ui:control>
  <ui:control multi-value="true">
<!-- highlight-start -->
    <ListBox Style="{StaticResource ControlStyle}" MinHeight="21" MaxHeight="84"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"/>
<!-- highlight-end -->
  </ui:control>
</type-config>
```

  </TabItem>
  <TabItem value="html-control" label="HTML SPA">

```xml
<type-config type="selection">
  <ui:html-control>
<!-- highlight-next-line -->
    <select xmlns="http://www.w3.org/1999/xhtml"/>
  </ui:html-control>
  <ui:html-control multi-value="true">
<!-- highlight-next-line -->
    <select multiple="multiple" xmlns="http://www.w3.org/1999/xhtml"/>
  </ui:html-control>
</type-config>
```

  </TabItem>
</Tabs>

If you want to configure certain UI controls for the entire data object rather than for individual properties, such as the grid attributes to use for list objects, then you can add it at the end of the `xfk:data-object` declaration using the framework-specific elements, e.g., `ui:blazor-controls` for Xomega Blazor. These elements use the same structure as the corresponding [default configuration](config#ui-controls) in the `global_config.xom`.

The following example illustrates a custom grid configuration for a `SalesOrderList` object for some Blazor UI frameworks.

<Tabs>
  <TabItem value="blazor-control" label="Xomega Blazor">

```xml
<xfk:data-object class="SalesOrderList" list="true">
  ...
  <ui:blazor-controls>
<!-- highlight-start -->
    <ui:XGrid AllowPaging="true" PagesToShow="5" PageSizes="new[] { 8, 15, 25, 50 }"
              AllowSorting="true" AllowSelection="true"/>
<!-- highlight-end -->
  </ui:blazor-controls>
</xfk:data-object>
```

  </TabItem>
  <TabItem value="sf-blazor-control" label="Syncfusion Blazor">

```xml
<xfk:data-object class="SalesOrderList" list="true">
  ...
  <blazor-controls xmlns="http://www.xomega.net/xsf">
<!-- highlight-start -->
    <XSfGrid AllowPaging="true" AllowReordering="true" AllowResizing="true"
             AllowSelection="true" AllowSorting="true" ShowColumnChooser="true" ShowColumnMenu="false">
      <XSfGridSelectionSettings PersistSelection="true"/>
      <GridSearchSettings IgnoreCase="true" />
      <GridPageSettings PageSizes="true" />
    </XSfGrid>
<!-- highlight-end -->
  </blazor-controls>
</xfk:data-object>
```

  </TabItem>
</Tabs>

### UI field config

For each data object property, you can configure the options of the corresponding UI field using a `ui:field` element under the `ui:display/ui:fields` of your data object, as follows.

```xml
<xfk:data-object class="SalesOrderDetailObject">
  <ui:display>
    <ui:fields field-cols="2">
<!-- highlight-start -->
      <ui:field param="sales order detail id" hidden="true"/>
      <ui:field param="sales order id" hidden="true"/>
      <ui:field param="sales order number" hidden="true"/>
      <ui:field param="subcategory" editable="true"/>
      <ui:field param="product id" label="Product"/>
      <ui:field param="special offer id" label="Special Offer"/>
<!-- highlight-end -->
    </ui:fields>
  </ui:display>
</xfk:data-object>
```

The `ui:field` element allows you to specify the following configuration attributes.
- `param` - the name of the data object's field to customize.
- `label` - custom text for the field's label. Generated to the default resource file, which can be translated into other languages.
- `access-key` - access key for the field. Generated to the default resource file and can be customized for other languages. 
- `hidden` - specifies if the field should not appear on the data object's views.
- `editable` - specifies whether the field should be displayed as a regular or a read-only control. Overrides Xomega logic for determining read-only fields based on the types of operations it appears in.
- `is-trigger` - specifies whether the field triggers updates in other controls. Used in WebForms to set the AutoPostBack attribute.
- `typical-length` - specifies the typical length of the field's values used for sizing columns. Overrides typical length derived from the field's logical type.
- `width` - explicit width string for the field that is technology-specific, e.g., CSS-style. Used for web-based data grids, overrides the width calculated from the typical length of the field.

### UI panel layout

:::caution
The following functionality is currently supported only for the modern Blazor views but not for WebForms, WPF, or SPA views.
:::

The main UI panel with the data object fields uses a responsive grid to lay out the controls in a number of grid columns. The number of columns is determined dynamically based on the screen size and the number of open views, but you can set the `field-cols` attribute of the `ui:fields` element to configure the maximum number of columns to use.

You can also set the `field-width` attribute to customize the preferred width of the columns in pixels, which is used for calculating the number of grid columns to use for the layout. In the following example, the fields of the `AddressObject` are laid out in up to 3 columns with the preferred width of 100px.

```xml
<xfk:data-object class="AddressObject" customize="true">
  <ui:display>
<!-- highlight-next-line -->
    <ui:fields field-cols="3" field-width="100">
      <ui:field param="address id" label="Address Type"/>
      <ui:field param="address line1" editable="false"/>
      <ui:field param="address line2" editable="false"/>
      <ui:field param="city state" editable="false" label="City/State"/>
      <ui:field param="postal code" editable="false"/>
      <ui:field param="country" editable="false"/>
    </ui:fields>
  </ui:display>
</xfk:data-object>
```

If a data object has child objects, then in addition to the main panel with data object fields, the top-level data object panel will also contain the panels for its child objects. By default, the main panel and the child panels will also be laid out using a responsive grid with one column that is stacked up, but you can customize it for each panel.

To customize the main panel, you can set corresponding attributes on the `ui:fields` element. To customize individual child panels, you need to add a `ui:panel` for that child under the `ui:child-panels` element and set the following attributes there.
- `child` - the name of the child object for the child panel.
- `title` - a custom title for the child or main panel. By default, the main panel will have no title, and the title of the child panel will be derived from the child's name. The title provided will be added to a resource file that can be localized to other languages.
- `panel-cols` - the number of columns that the parent panel has for the current panel. For example, the value "1" means that the panel takes the full width, value "2" means that it takes half of the parent panel's width, value "3" takes a third of the parent, etc.
- `field-cols` - the maximum number of columns the panel uses to lay out its fields. For child panels, this value overrides the default value specified on the `ui:fields` of that child object for this particular child.
- `field-width` - the preferred column width for the panel fields, which is used to calculate the number of columns in runtime. For child panels, this value overrides the default value specified on the `ui:fields` of that child object for this particular child.

The following example illustrates custom configurations of the main and child panels for the `SalesOrderCustomerObject`.

```xml
<xfk:data-object class="SalesOrderCustomerObject">
  <xfk:add-child name="lookup" class="SalesCustomerLookupObject"/>
  <xfk:add-child name="billing address" class="AddressObject"/>
  <xfk:add-child name="shipping address" class="AddressObject"/>
  <ui:display>
<!-- highlight-next-line -->
    <ui:fields field-cols="2" panel-cols="2" title="Customer Info">[...]
    <ui:child-panels>
<!-- highlight-start -->
      <ui:panel child="lookup" panel-cols="2" field-cols="2" title="Lookup Customer"/>
      <ui:panel child="billing address" panel-cols="2"/>
      <ui:panel child="shipping address" panel-cols="2"/>
<!-- highlight-end -->
    </ui:child-panels>
  </ui:display>
</xfk:data-object>
```

:::note
From the examples above, both `billing address` and `shipping address` panels will be laid out in 3 columns based on the `field-cols` configuration in the `ui:fields` of the `AddressObject` declaration, but you can override this and other attributes for either of these child panels.
:::

### Tabbed children

If you don't want to show all child objects on the same panel as the main object's fields, you can place all or some of the child objects in one or more tab groups. To display all child objects in one tab group below the main fields, you can just add a `ui:tabs` element to the object's `ui:display`, as follows.

```xml
<xfk:data-object class="SalesOrderObject">
  <xfk:add-child name="customer" class="SalesOrderCustomerObject"/>
  <xfk:add-child name="detail" class="SalesOrderDetailList"/>
  <xfk:add-child name="payment" class="SalesOrderPaymentObject"/>
  <xfk:add-child name="sales" class="SalesOrderSalesObject"/>
  <ui:display>
    <ui:fields>[...]
<!-- highlight-next-line -->
    <ui:tabs/>
  </ui:display>
</xfk:data-object>
```

You can also put some child objects in a tab group, while others will remain as panels by including both the `ui:child-panels` and the `ui:tabs` display elements and listing specific children under one or another. If your tabs should not use the entire width of the view, then you can set the `panel-cols` attribute on the `ui:tabs` element.

For example, if we want to put billing and shipping addresses in the `SalesOrderCustomerObject` under a dedicated tab group while the `lookup` child remains in a panel, then you can do it as follows.

```xml
<xfk:data-object class="SalesOrderCustomerObject">
  <xfk:add-child name="lookup" class="SalesCustomerLookupObject"/>
  <xfk:add-child name="billing address" class="AddressObject"/>
  <xfk:add-child name="shipping address" class="AddressObject"/>
  <ui:display>
    <ui:fields field-cols="2" panel-cols="2" title="Customer Info">[...]
    <ui:child-panels>
      <ui:panel child="lookup" panel-cols="2" field-cols="2" title="Lookup Customer"/>
    </ui:child-panels>
<!-- highlight-start -->
    <ui:tabs panel-cols="1">
      <ui:tab child="billing address" title="Billing"/>
      <ui:tab child="shipping address" title="Shipping"/>
    </ui:tabs>
<!-- highlight-end -->
  </ui:display>
</xfk:data-object>
```

:::note
As you can see above, you can also set a localizable custom title for each child tab in the `title` attribute of the corresponding `ui:tab` element.
:::

## UI views

You declare your UI views in the Xomega presentation model using `ui:view` elements under the `ui:views` child at the end of the top-level `module` element. Each view should have a unique name specified in the `name` attribute.

You can also set a custom localizable base title for the view in the `title` attribute. The actual view title may change based on the state of the view. For instance, the title would be "New Sales Order" when creating a new object. For dynamic view titles, you can include some placeholders in the base title, as illustrated by the `SalesOrderDetailView` view below, but you will need to customize the view model and override the `BaseTitle` there to populate the values.

```xml
<module xmlns="http://www.xomega.net/omodel"
        xmlns:ui="http://www.xomega.net/ui"
        name="sales">
  ...
  <ui:views>
    <ui:view name="SalesOrderView" title="Sales Order">[...]
    <ui:view name="SalesOrderListView" title="Sales Order List" customize="true">[...]
<!-- highlight-next-line -->
    <ui:view name="SalesOrderDetailView" title="Line Item for Sales Order {0}" child="true">[...]
  </ui:views>
</module>
```

If a view should be opened only from another view and not from the top-level navigation menu, then you need to set the `child="true"` attribute. In this case, the view will not be included in the generated navigation menu, which includes only the top-level views that you can open without parameters to start a new workflow.

:::note
For object details views, the navigation menu will include only the option to create a new object that requires no parameters. The view to open and edit details of an existing object that requires object ID parameters will be invoked as a child view from another view.
:::

The generated view will be for the specific UI framework, such as Blazor, WebForms, or WPF, but they will use common framework-agnostic view models. If you need to apply **UI framework-specific customizations** to a view, then you can add a `customize="true"` attribute to the view, and Xomega will generate a subclass or partial class for the view, where you can add your custom code.

### View model

Inside each view, you need to specify a `ui:view-model` child element, where you must set the main data object for the view in the `data-object` attribute, as follows.

```xml
<ui:view name="SalesOrderView" title="Sales Order">
<!-- highlight-next-line -->
  <ui:view-model data-object="SalesOrderObject" customize="true"/>
</ui:view>
<ui:view name="SalesOrderListView" title="Sales Order List">
<!-- highlight-next-line -->
  <ui:view-model data-object="SalesOrderList"/>
</ui:view>
```

The generated view models will contain platform-independent logic and actions for the view, as supported by the Xomega Framework. If the main data object for the view has a `list="true"` attribute set, then Xomega will generate a standard *Search View* with an optional criteria panel and a results grid. Otherwise, Xomega will generate a *Details View* for editing object details.

If you need to add or change any behavior for the generated view model, then you can set the `customize="true"` attribute on the `ui:`view-model` element, and Xomega will create and use a subclass of the generated view model, where you can add **custom platform-independent code**, or override any of the methods from the generated view model.

### Legacy layout config

As we described earlier, Xomega allows you to configure the layout of each individual UI panel on the data object level, which applies to the modern Blazor views. However, that configuration does not apply to the legacy WebForms, WPF, and SPA views, which still use the legacy layout configuration for the entire view.

To configure the layout for legacy views, you need to add a `ui:layout` child element to your `ui:view`, where you can set the `base` attribute to point to one of a saved [global layout configuration](config#legacy-layout-configs) or specify the layout details right inside the `ui:layout` element. If you do both, then what you specify for the view will override the global configuration inherited from the base layout, as illustrated below.

```xml
<ui:view name="SalesOrderListView" title="Sales Order List">
  <ui:view-model data-object="SalesOrderList"/>
<!-- highlight-next-line -->
  <ui:layout base="master-details">
    <ui:list>
      <ui:criteria>
        <ui:fields columns="2" flow="horizontal"/>
        <ui:errors position="top"/>
      </ui:criteria>
    </ui:list>
  </ui:layout>
</ui:view>
```

### Custom view layout

If you are unable to configure the layout of your data objects or view using the Xomega model to make the generated view look the way you need it to look, you can go ahead and just update the generated markup for the view directly.

However, to preserve your manual markup changes from being erased when the view is regenerated, you will need to set the `custom="true"` attribute on the `ui:layout` element of your view, as follows.

```xml
<ui:view name="SalesOrderView" title="Sales Order">
  <ui:view-model data-object="SalesOrderObject"/>
<!-- highlight-next-line -->
  <ui:layout custom="true"/>
</ui:view>
```

When you mark the view layout as custom like that, Xomega will not overwrite your markup or code-behind when generating the views.

:::caution
Obviously, this also means that your **view will not be automatically updated** if you add new fields or change your model otherwise, so you'll need to update such a view manually.
:::

:::tip
It's best to **stick to the auto-generated views** as much as possible during the prototyping phase when your model keeps changing, and only consider manually customizing the views when the model is stable.
:::

## Navigation

Navigation between UI views is modeled in the Xomega presentation model by configuring links to one of the defined views on the appropriate data objects.

### Object links to views

You can add links to any data object by adding a `ui:link` element, giving it a unique name within the object using the `name` attribute, and specifying the target view in the `view` attribute.

If you want the target view to open as a child of the current view, then you need to set the `child="true"` attribute. Otherwise, the link will open the view in a new workflow and may replace the current view when navigating to the new view. You can also set the `mode` attribute to either `inline` for a master-detail view or a `popup` for opening the view in a popup dialog.

To specify custom localizable text and access key for the link button, you can set the `title` and `access-key` attributes on the nested `ui:display` element as follows.

```xml
<xfk:data-object class="SalesOrderList" list="true">
  <ui:display>[...]
<!-- highlight-next-line -->
  <ui:link name="express" view="SalesOrderView" child="true" mode="inline">
    <ui:params>
      <ui:param name="_action" value="create"/>
      <ui:param name="type" value="EXPRESS"/>
    </ui:params>
<!-- highlight-next-line -->
    <ui:display title="Add Express Order" access-key="E"/>
  </ui:link>
</xfk:data-object>
```

In order to pass parameters to the target view, you need to add them as `ui:param` elements nested under the link's `ui:params` node, as shown above. For fixed-value parameters, you can set the parameter's `name` and the fixed `value` in the corresponding attributes.

For the parameter name, Xomega can suggest you a list of framework parameters that start with the "_" or one of the fields of the target view's main object, which will be pre-populated with that value when you open that view, but you can also use any other parameter name that is accepted by the target view. Following are the available framework parameters and their possible values.
- `_action` - an action to perform in the target view, as follows.
  - `create` - open details view to create a new object.
  - `search` - auto-run the search upon opening the view.
  - `select` - open search view to select one or multiple objects.
- `_selection` - selection mode for the target view: `single` or `multiple`.
- `_source` - ID of the source link when more than one link invokes the same view.

Instead of a fixed value, you can also source the parameter value from one of the properties of the current data object or any of the child or parent objects in its hierarchy. For that, instead of the `value` attribute, you should set the `field` attribute to one of the data object properties and optionally set a `data-object` attribute to the data object's path relative to the current object.

:::note
Xomega will provide Intellisense for both the relative paths in the `data-object` attributes and the properties of that object in the `field` attribute. It will also validate those attributes based on the structure of the data objects in the model.
:::

For example, in the following snippet, the parameter `type` is sourced from the field `order type` of a sibling data object named `child`, assuming that it exists in the data object hierarchy.

```xml
    <ui:params>
      <ui:param name="type" field="order type" data-object="../child"/>
    </ui:params>
```

### Links from a list

When you add a link to a list object and specify any link parameter that uses a list object's property, then the link will be displayed on each row of the bound data grid, as opposed to any links that don't use values from the list object's properties, which will be displayed as link buttons under the data grid.

You need to specify how to display a link on each row in the `ui:display` element of the link using one of the following options.
1. Set the `on-field` attribute to one of the visible properties of the list object. In this case, the link will be displayed as a hyperlink in the corresponding column, using the value of that column as the text.
1. Set the `on-selection="true"` attribute, which will not display the link but invoke it by default whenever you select a row in the data-bound grid, which is useful for master-details views.

You can also set both attributes, as shown below, but normally you want to set one or another.

```xml
<!-- highlight-next-line -->
<xfk:data-object class="SalesOrderList" list="true">
  <ui:display>[...]
  <ui:link name="details" view="SalesOrderView" child="true" mode="inline">
    <ui:params>
<!-- highlight-next-line -->
      <ui:param name="sales order id" field="sales order id"/>
    </ui:params>
<!-- highlight-next-line -->
    <ui:display on-field="sales order number" on-selection="true"/>
  </ui:link>
</xfk:data-object>
```

:::note
If you don't specify any of those `ui:display` attributes, such a link will be displayed on the first visible column of the grid.
:::

### Links with results

In addition to just invoking the target view with parameters, you can also configure a link to handle the results from invoking that view. This is useful when the target view is used for the selection or entering of some data that needs to be returned to the original view.

In this case, you need to add a `ui:result` element to your link, where you map the output parameters of the target view to the fields in the current data object, or any object in its hierarchy, as indicated by the `data-object` attribute relative path. If all fields to be updated are not on the current object, then you can also specify the `data-object` on the entire `ui:result` element.

In the following example, the `look up` link on the `SalesCustomerLookupObject` invokes a child `CustomerListView` for selecting a single customer and passes its entered values for the store and person name, as well as the default *Contains* (`CN`) operators. The resulting fields of the selected customer are then copied to the corresponding fields of its parent data object (`data-object=".."`).

```xml
<xfk:data-object class="SalesCustomerLookupObject">
<!-- highlight-next-line -->
  <ui:link name="look up" view="CustomerListView" child="true">
    <ui:params>
      <ui:param name="_action" value="select"/>
      <ui:param name="_selection" value="single"/>
      <ui:param name="store name operator" value="CN"/>
      <ui:param name="store name" field="store name"/>
      <ui:param name="person name operator" value="CN"/>
      <ui:param name="person name" field="person name"/>
    </ui:params>
<!-- highlight-start -->
    <ui:result data-object="..">
      <ui:param name="customer id" field="customer id"/>
      <ui:param name="store id" field="store id"/>
      <ui:param name="store name" field="store name"/>
      <ui:param name="person id" field="person id"/>
      <ui:param name="person name" field="person name"/>
      <ui:param name="account number" field="account number"/>
      <ui:param name="territory id" field="territory id"/>
    </ui:result>
<!-- highlight-end -->
  </ui:link>
</xfk:data-object>
```

:::note
Xomega will also provide Intellisense and validation on the result fields based on the structure of the target data object.
:::

:::tip
Another use case for this could be when you need to select some entity from a list, but it doesn't exist yet. So the link would open up a view for creating a new entity and return the ID and description of the newly created entity back to the original screen.
:::
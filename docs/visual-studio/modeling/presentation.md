---
sidebar_position: 5
---

# Presentation Model

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The Xomega presentation model defines UI views, their view models, and the underlying presentation data objects they comprise. Each of these entities has corresponding supporting classes in the Xomega Framework, which powers the generated application.

A unique feature of Xomega modeling is that you build your presentation model on top of your service model's structure. This approach eliminates the need to manually construct view and view model elements, automatically ties views to their corresponding service operations, and enables Xomega to generate a fully functional application with minimal effort.

Views defined in the presentation model can be used as individual screens or as building blocks for more complex screens and workflows within your application.

## Data objects


Xomega Framework data objects serve as data models for parts of your view, such as panels or data grids, which are bound to the data object and its properties. Any changes to data properties—including their states, such as visibility or editability—are automatically reflected in the bound UI controls. Updates made in editable controls are also automatically applied to the data properties.

Data objects can contain child objects, which is typically mirrored in the UI: a panel bound to a parent object contains sub-panels or data grids bound to its child objects. This allows you to build the general structure of your UI view by defining composable parent and child data objects.


Declare data objects in your model using the `xfk:data-object` element under the `xfk:data-objects` node, which should be placed at the end of the top-level `module` element. Set the `class` attribute to a unique class name for the data object, and use `list="true"` for list objects that represent tabular data typically bound to a data grid.


To use a custom subclass of the generated data object—allowing you to override methods and add functionality—add the `customize="true"` attribute to the data object declaration. Xomega will create and preserve this custom subclass whenever you regenerate data objects.


The following snippet illustrates data object declarations and their possible content elements, which should follow the order listed here.

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


If you declare a new data object as shown above, the Xomega model will warn you if your data object doesn't have any properties. Note that the data object definition in the model does not support listing its data properties explicitly; instead, properties are included implicitly based on your service model, as explained below.

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

:::warning
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

The UI display of a data object in the generated views will be based on its structure. Unless you organize data object's fields in [field groups](#ui-field-groups), the UI fields bound to the data object properties will appear on the screen in the same order that the corresponding data object parameters are first listed in the model.

For example, if the first structure that you add to your data object in the model file is an output structure of a `read` operation, and it returns all of the fields that you display on the screen, then the order of these parameters will determine the default order of the corresponding UI fields.

By default, data object's field groups and child objects will be displayed in vertically stacked panels under the main data object panel in the order they are listed in the model, unless you configure a specific [layout using panels and tabs](#panel-and-tab-layout) in the `ui:panel-layout` element of the data object.

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
- `is-trigger` - specifies whether the field triggers updates in other controls. Used in WebForms to set the `AutoPostBack` attribute.
- `typical-length` - specifies the typical length of the field's values used for sizing columns. Overrides typical length derived from the field's logical type.
- `width` - explicit width string for the field that is technology-specific, e.g., CSS-style. Used for web-based data grids, overrides the width calculated from the typical length of the field.

#### Criteria config

For [criteria objects](../../framework/common-ui/data-lists#criteria-object), you can also specify the following additional attributes in the `ui:field` element to customize the criteria fields.
- `static` - specifies whether the field criteria are [statically displayed](../../framework/common-ui/data-lists#editing-criteria-statically) in the criteria panel, or can be added and [edited dynamically](../../framework/common-ui/data-lists#editing-criteria-dynamically). You can also set the `static` attribute on the parent `ui:fields` element to apply it to all fields in the criteria panel, and then override it for individual fields as needed.
- `op-none` - set to indicate that the field should have no operator selection. An appropriate default operator for the field will be used, e.g. `Equals` for scalar fields and `Is One Of` for multi-value fields. You can also set the `op-none` attribute on the parent `ui:fields` element to apply it to all fields in the criteria panel, and then override it for individual fields as needed.
- `op-default` - a custom default operator for the field instead of the `Equals` and `Is One Of` operators for scalar and multi-value fields, respectively. If you add dynamic field criteria with an operator, the operator will be pre-populated with the default operator. If the field criteria has no operator, then the default operator will be used when passing that criteria to the service operation.
- `op-type` - custom logical type to use for the operator. By default, the `operator` type is used for criteria operators, but you can create a new `enum` with your own set of operators and define a logical type for it, so that you can override it for individual fields.

### UI field groups

:::warning
Field groups are currently supported only for Blazor views.
:::

If your non-list data object that is bound to a details view has many fields, you can define named field groups under the `ui:display` element of the data object. This will allow you to organize these field groups into panels or tabs on the details view in a way that makes sense for your users. To define named field groups, you can add `ui:fields` elements with the `group` attribute set to the name of the group, as illustrated below.

```xml
<xfk:data-object class="EmployeeObject">
  <ui:display>
    <ui:fields>
      <ui:field param="business entity id" hidden="true"/>
    </ui:fields>
    <ui:fields group="name" title="Employee Name">
      <ui:field param="first name"/>
      <ui:field param="middle name"/>
      <ui:field param="last name"/>
    </ui:fields>
    <ui:fields group="personal" title="Personal Info">
      <ui:field param="birth date"/>
      <ui:field param="gender"/>
      <ui:field param="national id number"/>
      <ui:field param="marital status"/>
    </ui:fields>
    <ui:fields group="email phone" title="Email / Phone">
      <ui:field param="email address"/>
      <ui:field param="phone number"/>
      <ui:field param="phone number type id" label="Phone Number Type"/>
    </ui:fields>
  </ui:display>
</xfk:data-object>
```

The `ui:fields` element without the `group` attribute is used to configure the fields that are not part of any group. The `ui:display` section cannot have more than one default `ui:fields` element without the `group` attribute.

While the default `ui:fields` element contains only the fields that you want to configure, a named field group has all its fields listed explicitly, which allows you to **control the order of the fields** on the panels. For all other fields that are not part of any group, the order will be determined by the order of the corresponding parameters in the service operations (typically the output of the `read` operation).

Each `ui:field` element in the field group can have the same attributes as described in the [UI field config](#ui-field-config) section above, such as `label`, `editable`, etc, although some attributes, such as `hidden`, may not make sense for fields in a group.

You can also set the `title` attribute on the `ui:fields` element to specify a custom title for the corresponding panel or tab. If you don't set the `title`, then the title will be derived from the group name. The value you set for the `title` will be added to a common resource file that can be localized to other languages.

### Responsive layout

In the generated Blazor views, UI panels bound to field groups of a data object use a responsive grid to lay out the controls in a number of grid columns. The number of columns is determined dynamically based on the screen size and the number of open views side by side.

By default, the maximum number of columns for a field group is 4, but you can configure it by setting the `field-cols` attribute of the `ui:fields` element.

You can also set the `field-width` attribute to customize the preferred width of the columns in pixels, which is used for calculating the number of grid columns to use for the layout. The default value for the `field-width` is 150px.

In the following example, the fields of the `AddressObject` are laid out in up to 3 columns with the preferred width of 100px.

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

If you have multiple UI panels to display your data object fields, those panels will be stacked up vertically by default, meaning that each panel will take the full width of its container. If you want to display the panels side by side instead, you can set the `panel-cols` attribute to indicate the fraction of the parent panel's width that the current panel should take.

For example, if you set `panel-cols="2"`, then the panel will take half of the parent panel's width, and if you set `panel-cols="3"`, then it will take a third of the parent panel's width, etc.

In the following configuration, field groups "name" and "personal" of the `EmployeeObject` will each take half of the parent panel's width. If displayed in the same row, then they will appear side by side.

```xml
<xfk:data-object class="EmployeeObject" customize="true">
  <ui:display>
    <ui:fields>[...]
<!-- highlight-start -->
    <ui:fields group="name" panel-cols="2">[...]
    <ui:fields group="personal" panel-cols="2">[...]
<!-- highlight-end -->
  </ui:display>
</xfk:data-object>
```

Since neither of these field groups has the `field-cols` attribute set, they will each use the default value of 4 columns for the layout of their fields. If there is not enough space to display 4 columns in each panel side by side, considering configured field widths, then the panels will be stacked up vertically, taking the full width of their parent panel. If there's still not enough space to display even 4 columns in such a stacked layout, then fields in each panel will start wrapping around using fewer columns, down to 1 column if necessary.

:::note
UI views generated for WebForms, WPF, or HTML SPA frameworks do not use responsive layout. The `field-cols` attribute is used as the exact number of columns to use for the layout there, and the `field-width` and `panel-cols` attributes are ignored.
:::

### Panel and tab layout

:::warning
Panel layout is currently supported only for the modern Blazor views. WebForms, WPF, or SPA views use the legacy [`ui:layout`](#legacy-layout-config).
:::

#### Default layout

If your data object has field groups and child objects, but no explicit layout to arrange them on the details view, then the generated view will have them laid out in vertically stacked panels. The first panel will contain all the fields that are not part of any field group. Stacked below that panel will be the panels for each field group followed by the panels for each child object. The order of the field groups and child objects will be based on the order they are declared in the model.

#### Panel layout

To explicitly configure the layout of field groups and child objects on the details view, you can add the `ui:panel-layout` element under the `ui:display` element of your data object after any `ui:fields` elements. In this element, you can specify the field groups and child objects that you want to display in the panels, the order of those panels, and how they should be arranged on the screen or grouped into tabs.

To show a panel for a specific field group or a child object, you can add a `ui:panel` element in the appropriate place under the `ui:panel-layout` element and set the `group` or `child` attribute to the name of the field group or child object, respectively. 

To display a panel for all fields that are not part of any field group, you can add a `ui:panel` element without the `group` or `child` attribute. Such a panel may have no title, in which case it's better to add it as the first panel.

You can also configure a specific title for the panel, as well as attributes for [responsive layout](#responsive-layout) described above. Here is the full list of attributes that you can set on the `ui:panel` element.

- `group` - the name of the field group to show in this panel.
- `child` - the name of the child object to show in this panel. Cannot be used together with the `group` attribute.
- `title` - a custom title for the panel, will be added to a resource file that can be localized to other languages. If this attribute is not specified, the title will be determined as follows.
  - For field groups, the title will either come from the `title` attribute of the field group, or be derived from the name of the field group.
  - For child objects, the title will be derived from the name of the child for this panel.
  - For the main panel, the title will be blank if neither `group` nor `child` attribute is specified.
- `visible-flag` - The name of the flag to use for conditional visibility check. When blank, the name is generated.
- `field-cols` - the maximum number of columns the panel uses to lay out its fields.
  - For panels bound to a child object, set it to the maximum number of columns that the child object can use, which helps to calculate the desired width of the panel.
  - For panels bound to a field group, this value overrides the default value specified on the `ui:fields` of that field group, if any. 
- `field-width` - the preferred column width for the panel fields, which is used to calculate the number of columns in runtime.
  - For panels bound to a child object, it should match the preferred field width for that child object.
  - For panels bound to a field group, this value overrides the default value specified on the `ui:fields` of that field group, if any.
- `panel-cols` - the fraction of the parent container that the current panel should take, e.g. 1 for full width, 2 for half, etc.
  - For panels bound to a field group, this value overrides the default value specified on the `ui:fields` of that field group, if any.

In the following example, the `EmployeeObject` has a main panel with all fields that are not part of any field group, followed by panels `name` and `personal` panels that show their fields in a single column side by side. Stacked below those panels is the `address` panel that shows the `EmployeeAddressObject` child object using the title "Home Address".

```xml
<xfk:data-object class="EmployeeObject">
  <xfk:add-child name="address" class="EmployeeAddressObject"/>
  <ui:display>
    <ui:fields>[...]
    <ui:fields group="name" title="Employee Name">[...]
    <ui:fields group="personal" title="Personal Info">[...]
    <ui:fields group="email phone" title="Email / Phone">[...]
    <ui:panel-layout>
<!-- highlight-start -->
      <ui:panel/>
      <ui:panel group="name" field-cols="1" panel-cols="2"/>
      <ui:panel group="personal" field-cols="1" panel-cols="2"/>
      <ui:panel child="address" field-cols="2" title="Home Address"/>
<!-- highlight-end -->
    </ui:panel-layout>
  </ui:display>
</xfk:data-object>
```

Note that the `email phone` field group is not going to be displayed on the details view, because it's not included in the `ui:panel-layout`. Also, the `field-cols` for the childe `address` panel is set to 2, assuming that the `EmployeeAddressObject` is configured to use 2 columns for its fields.

:::tip
We recommend that you set the title for field groups on the `ui:fields` element, and the title for child panels on the `ui:panel` element. Also, while you can set the `field-cols` and `panel-cols` attributes on the `ui:fields` element, we recommend that you set them on the corresponding `ui:panel` element to keep all the layout configuration for field groups under the `ui:panel-layout` element.
:::

#### Tabs layout

To be able to show more panels on the details view without making it too cluttered, you can group some of the panels into tabs. To do that, you can add a `ui:tabs` element under the `ui:panel-layout` element and then add `ui:tab` elements for each tab that you want to show.

By default, the `ui:tabs` element will take the full width of the parent panel, but you can set the `panel-cols` attribute to specify how many columns it should take, as well as the `field-cols` and `field-width` attributes for the maximum number of columns and the preferred width of the fields in the tabs, respectively.

Under the `ui:tabs` element, you can add a number of `ui:tab` elements and specify the following attributes for each tab.
- `title` - the title of the tab, which will be added to a resource file that can be localized to other languages.
- `group` - the name of the field group to show in this tab. Cannot be used together with the `child` attribute.
- `child` - the name of the child object to show in this tab. Cannot be used together with the `group` attribute.
- `visible-flag` - the name of the flag to use for conditional visibility check. When blank, the name is generated.

Instead of the `group` or `child` attribute, you can also add a `ui:panel` element (without a `title` attribute) inside the `ui:tab` element to show a panel for a specific field group or child object. To display more than one panel or other nested tabs in a tab, you can add `ui:panel` and `ui:tabs` elements inside the `ui:tab` element as needed.

Let's consider the following example of a layout for the `EmployeeObject`. Under the main panel with all fields that are not part of any field group and the `name` panel, there is a tab group with two tabs. The first tab shows the `personal` field group, while the second tab shows the `email phone` field group and a panel for the `address` child object.

```xml
<xfk:data-object class="EmployeeObject">
  <xfk:add-child name="address" class="EmployeeAddressObject"/>
  <ui:display>
    <ui:fields>[...]
    <ui:fields group="name" title="Employee Name">[...]
    <ui:fields group="personal" title="Personal Info">[...]
    <ui:fields group="email phone" title="Email / Phone">[...]
    <ui:panel-layout>
      <ui:panel/>
      <ui:panel group="name" field-cols="3"/>
<!-- highlight-start -->
      <ui:tabs>
        <ui:tab title="Basic Info" group="personal"/>
        <ui:tab title="Contact" visible-flag="">
          <ui:panel group="email phone" field-cols="3"/>
          <ui:panel child="address" title="Home Address"/>
        </ui:tab>
      </ui:tabs>
<!-- highlight-end -->
    </ui:panel-layout>
  </ui:display>
</xfk:data-object>
```

:::note
The "Contact" tab also has a `visible-flag` attribute, which generates a flag that can be used to control its visibility, as described below.
:::

#### Conditional panel visibility

Typically, you control the visibility of UI controls bound to data object properties by setting the [`Visible` flag](../../framework/common-ui/properties/base#property-visibility) of the underlying data property either directly or using an expression for [computed visibility](../../framework/common-ui/properties/base#computed-visibility).

However, panels and tabs don't have their visibility tied to any particular property in the view model, which makes it difficult to control their visibility based on security privileges, the state of the data object, or other criteria.

To address this, you can set the `visible-flag` attribute on the `ui:panel` or `ui:tab` element, which will generate a boolean property in the view model that you can use to control the visibility of that panel or tab. If you leave the `visible-flag` attribute blank, then Xomega will generate a name for the property based on the name of the field group or child object for that panel or tab.

The generated flag property is read-only and always returns `true` by default in the generated view model. To implement your own logic for that flag, you need to customize the view model by setting the `customize="true"` attribute on the `ui:view-model` element of the view, and then override the generated flag property in the customized subclass of the view model.

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
    <ui:view name="SalesOrderDetailView" title="Line Item for Sales Order {0}">[...]
  </ui:views>
</module>
```

The generated view will be for the specific UI framework, such as Blazor, WebForms, or WPF, but they will use common framework-agnostic view models. If you need to apply **UI framework-specific customizations** to a view, then you can add a `customize="true"` attribute to the view, and Xomega will generate a subclass or partial class for the view, where you can add your custom code.

### Security policy

:::warning
Authorization policy is an ASP.NET Core concept, so this is only applicable to Blazor applications.
:::

To configure security access for a specific view, you can define an authorization policy and set it in the `policy` attribute of the `ui:view` element, as follows.

```xml
<ui:view name="SalesOrderView" title="Sales Order" policy="Sales">[...]
<ui:view name="SalesOrderListView" title="Sales Order List" policy="Sales">[...]
```

The [Blazor Views generator](../../generators/presentation/blazor/views) will use this policy to secure both the navigation [menu items](../../framework/blazor/components#menu-security) and the corresponding page using an `Authorize` attribute. You can also specify a different [policy for individual main menu links](../../visual-studio/modeling/presentation#security-policy-for-main-menu-links) within the view.

#### Conditional security policy

Sometimes the same view may require different security policies based on the parameters passed to it in the URL. For example, the `EmployeeView` view may accept an `EmployeeId` query parameter to view a specific employee or the `action=create` query parameter to create a new employee. In this case, you may need to use the following security policies based on the activation parameters.
- `Employee_Create` - when the `action=create` parameter is present.
- `Employee_View` - when the `EmployeeId` parameter is for the currently logged-in user.
- `Employee_View_Others` - when the `EmployeeId` parameter is for another user.

The `EmployeeViewPage.razor` file generated by the [Blazor Views generator](../../generators/presentation/blazor/views) will include a field `AuthPolicy` set to the view's `policy` attribute, as well as a partial method `SetAuthPolicy()`. To implement conditional security policies, you can add a partial class `EmployeeViewPage` in the `EmployeeViewPage.razor.cs` file and override the `SetAuthPolicy()` method to set the `AuthPolicy` field based on the parameters passed to the view.

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

If you need to add or change any behavior for the generated view model, then you can set the `customize="true"` attribute on the `ui:view-model` element, and Xomega will create and use a subclass of the generated view model, where you can add **custom platform-independent code**, or override any of the methods from the generated view model.

### Legacy layout config

As we described earlier, Xomega allows you to configure the layout of each individual UI panel on the data object level, which applies to the modern Blazor views. However, that configuration does not fully apply to the legacy WebForms, WPF, and SPA views, which still use the legacy layout configuration for the entire view.

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

:::warning
Obviously, this also means that your **view will not be automatically updated** if you add new fields or change your model otherwise, so you'll need to update such a view manually.
:::

:::tip
It's best to **stick to the auto-generated views** as much as possible during the prototyping phase when your model keeps changing, and only consider manually customizing the views when the model is stable.
:::

## Navigation

Xomega presentation model allows you to define both the navigation from the main menu to the top-level views and the navigation between the views. The main menu is generated based on the `ui:main-link` elements defined in the `ui:view` elements, while the navigation between views is modeled by [configuring object links](#object-links-to-views) to one of the defined views on the appropriate data objects of the original view.

### Main menu links

To allow opening a view from the main menu, you need to add a `ui:main-link` element to the `ui:view` element of the target view. The `name` attribute of the link should be unique across all views and will be used as the text of the menu item by default.

The main menu items will be grouped into submenus based on the name of the view's module. For the views under the module that has no name (i.e. the default module), the menu items will be grouped under the "Views" submenu.

You can also override the menu item text and the name of the menu group by adding a `ui:display` element under the `ui:main-link` element, and setting one of the following attributes on it.
- `title` - custom text for the menu item instead of the `name` attribute of the `ui:main-link` element.
- `icon` - custom Bootstrap icon name to use for the menu item.
- `group` - custom name of the menu group to use instead of the module name.

The following example illustrates a main menu link for the `SalesOrderListView` view with a custom name, icon and group name.

```xml
<ui:view name="SalesOrderListView" title="Sales Order List">
  <ui:view-model data-object="SalesOrderList"/>
<!-- highlight-start -->
  <ui:main-link name="sales orders">
    <ui:display title="Browse Sales Orders" icon="card-checklist" group="Sales Orders"/>
  </ui:main-link>
<!-- highlight-end -->
</ui:view>
```

:::note
The text for the menu item and group name will be generated to the default resource file, which can be translated into other languages.
:::

#### Security policy for main menu links

By default, the main menu links will use the security policy defined for the view, if any. However, you can set a different security policy for a view's main menu link by adding a `policy` attribute to the `ui:main-link` element, as shown below.

```xml
<!-- highlight-next-line -->
<ui:view name="EmployeeView" title="Employee" policy="Employee_View">
  <ui:view-model data-object="EmployeeObject"/>
<!-- highlight-next-line -->
  <ui:main-link name="new employee" policy="Employee_Create">
    <ui:params>
      <ui:param name="_action" value="create"/>
    </ui:params>
  </ui:main-link>
</ui:view>
```

In this example, the `EmployeeView` view, which allows both viewing and creating employees, has a policy set to `Employee_View`, while the main menu link for creating a new employee has a different, more strict, policy set to `Employee_Create`.

#### Opening views with auto-search

If you want your menu item to open the view and automatically run the search, instead of displaying the view with an empty grid and waiting for the user to enter the search criteria, then you can add a `ui:params` element under the `ui:main-link` element and set the `_action` parameter to `search`. You can also set other parameters to pre-populate the search criteria, as shown in the following example.

```xml
<ui:view name="SalesOrderListView" title="Sales Order List">
  <ui:view-model data-object="SalesOrderList"/>
  <ui:main-link name="current sales orders">
<!-- highlight-start -->
    <ui:params>
      <ui:param name="_action" value="search"/>
      <ui:param name="status" value="1"/>
    </ui:params>
<!-- highlight-end -->
  </ui:main-link>
</ui:view>
```

:::tip
Use auto-search with pre-populated criteria only when the user does not need to change the criteria in most cases. If the user will mostly need to change the criteria, then you can still pre-populate some of the criteria parameters, but without the auto-search, in order to avoid running an expensive search operation initially.
:::

#### Opening details views from the main menu

Typically, opening a details view for an existing entity is done from other screens, where you have the ID of the entity to open, so it does not make much sense to open it from the main menu. However, you may still want to allow opening a details view for creating a new entity from the main menu.

To add a main menu item for creating a new entity, you can set the `_action` parameter to `create` in the `ui:params` element under the `ui:main-link` element. You can also set other parameters to pre-populate the details view, as shown in the following example.

```xml
<ui:view name="SalesOrderView" title="Sales Order">
  <ui:view-model data-object="SalesOrderObject"/>
<!-- highlight-start -->
  <ui:main-link name="express sales order">
    <ui:params>
      <ui:param name="_action" value="create"/>
      <ui:param name="type" value="EXPRESS"/>
    </ui:params>
    <ui:display title="Add Express Order"/>
  </ui:main-link>
<!-- highlight-end -->
</ui:view>
```

:::note
You can still fine-tune or completely override the structure of the generated main menu in the code as needed.
:::

### Object links to views

Navigation from one UI view to another is modeled in the Xomega presentation model by configuring links to one of the defined views on the appropriate data objects.

You can add links to any data object by adding a `ui:link` element, giving it a unique name within the object using the `name` attribute, and specifying the target view in the `view` attribute.

If you want the target view to open as a child of the current view, then you need to set the `child="true"` attribute. Otherwise, the link will open the view in a new workflow and may replace the current view when navigating to the new view. You can also set the `mode` attribute to either `inline` for a master-detail view or a `popup` for opening the view in a popup dialog.

To specify custom localizable text and access key for the link button, you can set the `title` and `access-key` attributes on the nested `ui:display` element, as shown below.

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

:::tip
If the link is on a non-list data object with [field groups](#ui-field-groups) defined, and you want to have the link displayed on a specific field group, then you can also set the `group` attribute on the `ui:display` element.
Note: this is a **Blazor-specific** feature, and it is not supported in the legacy WebForms, WPF, or SPA views.
:::

#### Link parameters

In order to pass parameters to the target view, you need to add them as `ui:param` elements nested under the link's `ui:params` node, as shown above. For fixed-value parameters, you can set the parameter's `name` and the fixed `value` in the corresponding attributes.

For the parameter name, Xomega can suggest you a list of framework parameters that start with the "_" or one of the fields of the target view's main object, which will be pre-populated with that value when you open that view, but you can also use any other parameter name that is accepted by the target view. Following are the available framework parameters and their possible values.
- `_action` - an action to perform in the target view, as follows.
  - `create` - open details view to create a new object.
  - `search` - auto-run the search upon opening the view.
  - `select` - open search view to select one or multiple objects.
- `_selection` - selection mode for the target view: `single` or `multiple`.
- `_source` - ID of the source link when more than one link invokes the same view.

#### Parameter values from properties

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

In the following example, the `look up` link on the `SalesCustomerLookupObject` invokes a child `CustomerListView` for selecting a single customer and passes its entered values for the store and person name, as well as the default *Contains* (`CN`) operator. The resulting fields of the selected customer are then copied to the corresponding fields of its parent data object (`data-object=".."`).

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
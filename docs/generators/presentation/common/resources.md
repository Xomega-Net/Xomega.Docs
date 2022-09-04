---
sidebar_position: 3
---

# Label Resources

Generates a resource file with labels and titles for data properties, data objects and views declared in the model.

The generator uses specific labels and titles that are configured in the model for the corresponding entities, or uses their names to generate a label.

The generator uses standard format for the resource keys, which allows Xomega Framework to automatically set the labels for data properties and use them on the property-bound controls that support it, such as Blazor.

Other generators of views and the main menu can also use these resource keys to set localized titles for child panels or tabs, as well as the navigation buttons.

## Generator inputs

The generator uses the names of object properties, links and views, as well as custom label and title attributes to generate resources for field and link labels with access keys, panel and view titles, and top level navigation menus.

### Field labels and access keys

For each field/property on the data objects declared in the model the generator will create resources for their labels and access keys, if the latter are explicitly specified.

The following snippet shows an example of how a `SalesOrderList` object customizes labels for some of it properties, while labels for its other properties that are not listed or have no label attribute will be generated from their names.

```xml
<xfk:data-object class="SalesOrderList" list="true">
  <ui:display>
    <ui:fields>
      <ui:field param="sales order id" hidden="true"/>
<!-- highlight-start -->
      <ui:field param="sales order number" label="SO#"/>
      <ui:field param="online order flag" label="Online"/>
      <ui:field param="sales person id" label="Sales Person"/>
      <ui:field param="territory id" label="Sales Territory"/>
<!-- highlight-end -->
    </ui:fields>
  </ui:display>
</xfk:data-object>
```

### Link labels and access keys

For each link declared on the data objects in the model the generator will create resources for their labels and access keys, if the latter are explicitly specified.

The following snippet shows an example of how a `SalesOrderList` object customizes the label and access key for its `new` link, while the `details` link will be shown on the `sales order number` field and does not really need a label.

```xml
<xfk:data-object class="SalesOrderList" list="true">
  <ui:link name="details" view="SalesOrderView" child="true" mode="inline">
    <ui:params>
      <ui:param name="sales order id" field="sales order id"/>
    </ui:params>
    <ui:display on-field="sales order number" on-selection="true"/>
  </ui:link>
  <ui:link name="new" view="SalesOrderView" child="true" mode="inline">
    <ui:params>
      <ui:param name="_action" value="create"/>
    </ui:params>
<!-- highlight-next-line -->
    <ui:display title="New Order" access-key="N"/>
  </ui:link>
</xfk:data-object>
```

### Panel titles

For each child object declared on a data object in the model the generator will create resources for their titles, using either the child's name or the custom `title` attribute on the corresponding `ui:panel` or `ui:tab` element, as shown below.

```xml
<xfk:data-object class="SalesOrderCustomerObject" customize="true">
  <xfk:add-child name="lookup" class="SalesCustomerLookupObject"/>
  <xfk:add-child name="billing address" class="AddressObject"/>
  <xfk:add-child name="shipping address" class="AddressObject"/>
  <ui:display>
<!-- highlight-next-line -->
    <ui:fields field-cols="2" panel-cols="2" title="Customer Info">
      <ui:field param="customer id" hidden="true"/>
      <ui:field param="person id" hidden="true"/>
      <ui:field param="store id" hidden="true"/>
      <ui:field param="territory id" label="Territory"/>
    </ui:fields>
    <ui:child-panels>
<!-- highlight-next-line -->
      <ui:panel child="lookup" panel-cols="2" field-cols="2" title="Lookup Customer"/>
    </ui:child-panels>
    <ui:tabs>
<!-- highlight-start -->
      <ui:tab child="billing address" title="Billing"/>
      <ui:tab child="shipping address" title="Shipping"/>
<!-- highlight-end -->
    </ui:tabs>
  </ui:display>
</xfk:data-object>
```

:::note
Note, that the title for the main panel with object's fields will be displayed only if you specify the `title` attribute on the `ui:fields` element.
:::

### View titles

For each view declared in the model the generator will create resources for their titles, using either the view's name or the custom `title` attribute, as shown below.

```xml
<!-- highlight-next-line -->
<ui:view name="SalesOrderView" title="Sales Order">
  <ui:view-model data-object="SalesOrderObject" customize="true"/>
</ui:view>
```

### Navigation menus

For each primary view declared in the model without the `child` attribute, the generator will create resources for their navigation menu titles using the view's name or the `title` attribute.

The titles for details views, which would be for creating new details objects when opened from a top-level navigation menu, will be prefixed with a word "*New* ".

:::tip
You can always override specific resources in your own set of resources using the same key, or you can update the menu options to use a different resource key.
:::

### Static enumerations

For each item of a static enumeration defined in the model, the generator will create a resource with the default text for the item using the resource key formatted as `Enum_<EnumName>.<ItemValue>`, in order to allow [localization of the static data](../../../framework/common-ui/lookup#localizing-static-data). The default text will be either the content of the `text` child element, if provided, or the item's `name` attribute.

For example, you can define an enumeration `error severity`, and provide a custom `text` value for the *Error* severity as follows.

```xml
<!-- highlight-next-line -->
<enum name="error severity">
  <item name="Error" value="1">
<!-- highlight-next-line -->
    <text>Error!</text>
  </item>
<!-- highlight-start -->
  <item name="Warning" value="2"/>
  <item name="Info" value="3"/>
<!-- highlight-end -->
</enum>
```

In this case, the generator will add the following resources to the output file.

|Name|Value|Comment|
|-|-|-|
|Enum_error severity.1|Error!|
|Enum_error severity.2|Warning|
|Enum_error severity.3|Info|

## Generator outputs

This generator creates a single `.resx` XML file with resource keys and values, as well as a corresponding `.resx.cs` class that allows using a resource manager for the generated resources.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Label Resources|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Presentation Layer\Common|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Add To Project|../MySolution.Client.Common /MySolution.Client.Common.csproj|Relative path to the project file that the generated files will be added to. The project should have a `RootNamespace` set to allow retrieving of the resources in runtime.|
|Output Path|../MySolution.Client.Common/Labels.resx|Relative path where to output generated resource files.|

### Model configuration

The generator doesn't use any other configuration parameters from the model.

### Common configurations

There expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only.

You can rerun the generator when you change anything in the presentation or service model.

:::note
This generator can be included in the build of the model project in the configuration, in order to allow to easily regenerate all label resources along with other artifacts.
:::

### Customizing the output

:::danger
You should never edit generated resource files directly to allow re-running the generator at any time without losing your changes. 
:::

You should update the model as appropriate instead.

:::tip
Alternatively, you can override the values of the generated resources in your custom resources using the same resource keys, and use your custom resources in the `CompoundResourceManager` before the generated resources.
:::

### Cleaning generator’s output

This generator does not support separate cleaning, since it always regenerates all resources when you rerun it.
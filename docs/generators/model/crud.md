---
sidebar_position: 2
---

# Full CRUD with Views

This is the main, extremely flexible model enhancement generator, which allows you to quickly add and configure different model elements, such as `create`, `read`, `update`, `delete` (CRUD) and `read list` operations for the services, as well as corresponding presentation data objects and UI views, all based on the definition of your model objects.

## Generator inputs

When the generator is run on bare objects with just a list of fields, such as those that are freshly imported from a database, or when it adds new operations that don't exist in the model yet, it will use the structure of the object's fields and relationship with the parent object to generate appropriate operations.

:::note
It can also be run to enhance existing operations, such as to add REST methods or data objects and views to them, in which case it will keep and use the structure of those operations.
:::

## Generator outputs

This generator updates a single or multiple `.xom` files that contain model objects with operations, data objects, views, or other elements as configured by the generator parameters.

### CRUD Operations

When *Generate CRUD* or *Generate Subobject CRUD* parameters are set to `True`, the generator will add `create`, `read`, `update` and `delete` operations to the selected objects and/or their subobjects.

The input parameters of the CRUD operations will be based on the object key fields. Non-key fields will be also in the input of the `create` and `update` operations, as well as in the output of the `read` operation.

The input structures will be generated such that it would be easy to expose them via REST services. And if *Generate Rest Methods* parameter is set, then the generator will also configure the operations with annotations for REST method, as illustrated below.

```xml
<objects>
  <object name="sales order">
    <operations>
<!-- highlight-start -->
      <operation name="create" type="create">[...]
      <operation name="read" type="read">[...]
      <operation name="update" type="update">
<!-- highlight-end -->
        <input>
          <param name="sales order id"/>
          <struct name="data">...</struct>
        </input>
        <config>
<!-- highlight-start -->
          <rest:method verb="PUT" uri-template="sales-order/{sales order id}"
                       xmlns:rest="http://www.xomega.net/rest"/>
<!-- highlight-end -->
        </config>
      </operation>
<!-- highlight-next-line -->
      <operation name="delete" type="delete">[...]
    </operations>
  </object>
</objects>
```

After you add CRUD operations to an object, you can update their input and output parameters, as well as the REST method configuration as appropriate.

### Read List Operation

If you set the *Generate Read List* or *Generate Subobject Read List* parameters of the generator to `True`, the generator will add `read list` operations to the selected objects and/or their subobjects.

The output of the operation will have a `list="true"` attribute, and will contain all object's fields. The input parameters for a `read list` operation on a subobject will contain just the parent object's key fields.

For primary objects that don't have a parent though, the input parameters will contain all object's fields as criteria, if the *Generate Read List Criteria* parameter is set. Additionally, if *Generate Read List Operators* parameter is set, then the criteria input structure will have a special comparison operator parameter for each field, and there will be a second parameter added for fields that allow for a `BETWEEN` operator, such as for dates or numbers, to let you supply a range.

The following example illustrates such a setup.

```xml
<object name="sales order">
  <operations>
<!-- highlight-next-line -->
    <operation name="read list" type="readlist">
      <input>
<!-- highlight-next-line -->
        <struct name="criteria">
          <param name="sales order number operator" type="operator"/>
          <param name="sales order number" required="false"/>
          <param name="status operator" type="operator"/>
          <param name="status" required="false" list="true"/>
<!-- highlight-next-line -->
          <param name="order date operator" type="operator"/>
          <param name="order date" type="date" required="false"/>
<!-- highlight-next-line -->
          <param name="order date2" type="date" required="false"/>
        </struct>
      </input>
      <output list="true">...</output>
    </operation>
  </operations>
</object>
```

:::tip
If you generate a `read list` operation without criteria first, then you can add them later by setting the corresponding parameters, and rerunning the generator.
:::

As with the CRUD operations, specifying *Generate Rest Methods* parameter will also add a REST method configuration to the `read list` operations.

### Data Objects

When you set the *Generate Data Objects* parameter of the generator to `True`, the generator will add declarations of "details" or "list" objects for the corresponding CRUD or `read list` operations, and will add such data objects to the configuration of those operations, which determines the set of data object's properties, as follows.

```xml
<operation name="read list" type="readlist">
  <input>...</input>
  <output list="true">
    <param name="sales order id"/>
    <param name="sales order number"/>
    <config>
<!-- highlight-next-line -->
      <xfk:add-to-object class="SalesOrderList"/>
    </config>
  </output>
</operation>
```

In addition, the generator can configure the data objects to make a serial key field hidden when you specify the *Make Serial Keys Hidden* parameter. If the UI views are also being added, and the *Generate Links* parameter is set, then it will also add link configurations to list objects, which would open the corresponding details view, as illustrated below.

```xml
<xfk:data-objects xmlns:xfk="http://www.xomega.net/framework">
<!-- highlight-next-line -->
  <xfk:data-object class="SalesOrderList" list="true" customize="true">
    <ui:display>
      <ui:fields>
<!-- highlight-next-line -->
        <ui:field param="sales order id" hidden="true"/>
      </ui:fields>
    </ui:display>
<!-- highlight-next-line -->
    <ui:link name="details" view="SalesOrderView" child="true">
      <ui:params>
        <ui:param name="sales order id" field="sales order id"/>
      </ui:params>
      <ui:display on-field="sales order number"/>
    </ui:link>
  </xfk:data-object>
</xfk:data-objects>
```

The data objects serve as view models for search or details views, and are the main part of the views.

### Search/Details Views

When you set the *Generate Search View* or *Generate Details View* parameters of the generator to `True`, the generator will add declarations of search and/or details views based on the corresponding data objects as view models.

The view name should be unique, so it will be built from the object name, with a word "List" added for search views, and a postfix specified by the *View Name Postfix*, which is typically set to "*View*".

The following snippet illustrates such a view setup.

```xml
<ui:views xmlns:ui="http://www.xomega.net/ui">
<!-- highlight-next-line -->
  <ui:view name="SalesOrderView" title="Sales Order">
    <ui:view-model data-object="SalesOrderObject"/>
  </ui:view>
<!-- highlight-next-line -->
  <ui:view name="SalesOrderListView" title="Sales Order List">
    <ui:view-model data-object="SalesOrderList"/>
  </ui:view>
</ui:views>
```

### Dynamic Enumeration

For objects that represent static data that is stored in the database, but can be cached on the client, it makes sense to add a `read list` operation not so much for a search view, but rather to allow the client to read and cache that static data.

This is done by specifying the *Add Read List Enumeration* generator parameter, which will decorate the `read list` operation with a dynamic enumeration specification that tells the Xomega Framework which output parameter is an internal Id, and which one should be used as a user-facing description.

You can also set the *Make Key Type Enumerated* parameter to update the key type for the object, and link it to the new enumeration, which would provide a selection control for any field that is using that type, as illustrated below.

```xml
<types>
  <type name="sales territory" base="integer enumeration">
<!-- highlight-next-line -->
    <enum ref="sales territory"/>
  </type>
</types>
<objects>
  <object name="sales territory">
    <operations>
      <operation name="read list" type="readlist">
        <output list="true">
          <param name="territory id"/>
          <param name="name"/>
          <param name="country region code"/>
          <param name="group"/>
        </output>
        <config>
<!-- highlight-start -->
          <xfk:enum-cache enum-name="sales territory" id-param="territory id" desc-param="name"
                          xmlns:xfk="http://www.xomega.net/framework"/>
<!-- highlight-end -->
        </config>
      </operation>
    </operations>
  </object>
</objects>
```

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Full CRUD with Views|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Model Enhancement|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|False|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Operations**|
|Generate CRUD|True|Whether to generate `Create`, `Read`, `Update` and `Delete` operations.|
|Generate Read List|True|Whether to generate `Read List` operation.|
|Generate Read List Criteria|True|Whether to generate criteria for `Read List` operation.|
|Generate Read List Operators|True|Whether to generate operators for search criteria.|
|Generate Subobject CRUD|True|Whether to generate `Create`, `Read`, `Update` and `Delete` operations on sub-objects.|
|Generate Subobject Read List|True|Whether to generate `Read List` operation on sub-objects.|
|Generate Rest Methods|True|Whether to generate REST API methods on operations.|
|Use Yes/No Substitution|True|Whether to substitute `boolean` type with `yesno` type for non-required parameters of CRUD operations.|
|**Data&nbsp;Objects**|
|Generate Data Objects|True|Whether to generate Xomega.Framework Data Object definitions for operations.|
|Generate Links|True|Whether to generate links to corresponding details views on list objects.|
|Make Serial Keys Hidden|True|Whether to configure serial key fields as hidden on views.|
|**Views**|
|Generate Search View|True|Whether to generate a search view for list objects.|
|Generate Details View|True|Whether to generate a details view for CRUD objects.|
|View Name Postfix|View|Postfix to use for view names.|
|**Enumeration**|
|Add Read List Enumeration|False|Whether to add enumeration definition to the Read List operation.|
|Make Key Type Enumerated|False|Whether to update the key type to reference generated enumeration.|
|Add Suggest Type|False|Whether to add a separate type linked to the generated enumeration to suggest values, which also accepts other values.|

### Model configuration

The generator doesn't use any other configuration parameters from the model.

### Common configurations

This is a flexible generator that can be configured in different ways and saved as separate configurations for different scenarios. Below are some of the common configurations that can be created.

#### Full CRUD with Search and Details views

This is a default 'all inclusive' configuration with the values as described above. It can be used to quickly add all CRUD and `read list` operations to the barebone objects, as well as standard Search and Details views based on those operations.

#### Lookup view

If you only need a Search view to browse or look up the objects without editing their details, you can configure this generator to add just the `read list` operation, data objects without links, and a Search View, without selecting the CRUD operations or a Details View.

#### Enumeration Read List

For objects that contain static data that can be cached, you may not even need a search view, but rather a `read list` operation to provide data for the cached enumeration. To configure this, you can select the option to add a `read list` operation, and to decorate it with an enumeration specification. You can also configure it to update the key type of the object to link it to this enumeration, and thereby provide a selection control wherever it is being used on the UI.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for either one file, or for multiple selected files if you want to enhance multiple objects.

You can run a configuration that adds all enhancements at once, or you can create multiple configurations that add different enhancements, and then run them one by one. For example, you can add a `read list` operation first, and then CRUD operations, and then data object definitions, views etc.

:::caution
The generator is not supposed to be included in the model build process.
:::

### Customizing the output

After you have added your operations, data objects, or other enhancements with this generator, you can update the model to taylor your operations for your application. The generator creates operations based on all fields of the object, so it will be just a matter of removing parameters for the fields that you don't need in the operations, and adding parameters that are not based directly on the object's fields.

If you re-run the generator after updating the model, your manual changes should be largely preserved.

:::caution
However, it is still recommended to **check in your model** to your source control before re-running the generator, so that you could easily review the changes from it.
:::

### Cleaning generator’s output

This generator supports cleaning the enhancements it adds when you run the *Clean* command.

This could be useful during initial prototyping when you are actively changing the object fields, so that you could re-add the operations, or to clean up the model if you ran the generator on a wrong file.

:::danger
Keep in mind that the *Clean* operation will also remove any customizations that you may have made, so you want to make sure that you **check in your model** to your source control before running it to avoid any loss of useful model data.
:::
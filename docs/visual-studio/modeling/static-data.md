---
sidebar_position: 6
toc_max_heading_level: 4
---

# Static Data Model

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Most line-of-business applications have a certain amount of static data that does not change from one release of the application to another and yet is critical for the functioning of the application.

For example, a list of possible order statuses is usually known at design time since the application needs to have the code that handles each status. Therefore adding or changing a status would require a new release. Such a list is typically stored in a separate database table, hard-coded in various application selection lists, or defined as a plain enum.

The common problem with storing it exclusively in a database table is that you would not have that list readily available at design time, which also means no good version control or change history from one release to another. At best, the original source for that list will exist in some version-controlled SQL script that loads it into your table so that you can spin up and populate a new environment.

Hardcoding it in the application in a selection list or as a plain C# enum is also not great since you may need to do it in multiple places or be limited to specifying just the basic enum data you still cannot easily use it in design time for documentation or review, and each type of static data may be inconsistently defined using its own format.

Xomega model addresses these issues by providing a consistent, flexible, and extensible model for you to define your static data, which you can use both in runtime and in design time for documentation and review.

## Static enumerations

The way to describe your static data in the Xomega model is by defining a static enumeration using an `enum` element under the parent `enums` node of the top-level `module` element.

You need to give it a unique name in the `name` attribute, which should also not conflict with the name of any [dynamic enumerations](services#dynamic-enumerations) defined using `xfk:enum-cache` elements.

### Enumeration items

You can list the enumeration items in the nested `item` nodes with a unique `name` and `value` attributes within your enum, as follows.

```xml
<module xmlns="http://www.xomega.net/omodel"
        name="sales">
  <types>[...]
  <enums>
<!-- highlight-next-line -->
    <enum name="sales order status">
      <item name="In process" value="1"/>
      <item name="Approved" value="2"/>
      <item name="Backordered" value="3"/>
      <item name="Rejected" value="4"/>
      <item name="Shipped" value="5"/>
      <item name="Cancelled" value="6"/>
    </enum>
  </enums>
</module>
```

This would be very similar to how you define selection lists in HTML or other UI frameworks, where the value is what gets stored in the database and passed around, while the name is what usually gets displayed to the user.

:::caution
Xomega also generates C# constants for enumeration items, so the **name must be a valid identifier** except for any blank space. If the text you want to display to the user must contain illegal characters, or if it needs to be different from the name, then you should specify it in the inner `text` element as follows.
```xml
  <item name="In process" value="1">
<!-- highlight-next-line -->
    <text>(In process)</text>
  </item>
```
:::

:::note
If you need to display localized text to the user, then please check the section on [item text localization](#item-text-localization).
:::

#### Documenting items

Xomega model allows you to provide a description and documentation for your enumerations and any of their items using the standard `doc` and `summary` elements, as follows.

```xml
<enum name="sales order status">
  <item name="In process" value="1">
<!-- highlight-start -->
    <doc>
      <summary>Sales order has been received and is being processed.</summary>
    </doc>
<!-- highlight-end -->
  </item>
  ...
<!-- highlight-start -->
  <doc>
    <summary>The possible statuses of a sales order.</summary>
  </doc>
<!-- highlight-end -->
</enum>
```

:::tip
Since enumerations typically describe critical business data, we recommend that you document it in the model to keep it all together. Xomega will be able to use these descriptions in the generated application and also in the technical design documents generated from the model.
:::

#### Inactive items

As your application evolves from one release to another, so does your static data. If, at some point, you need to retire a certain enumeration item, then instead of deleting it, you may want to mark it as inactive by setting the `active="false"` attribute on it, as illustrated below.

```xml
  <item name="Rejected" value="4" active="false"/>
```

This will allow your application to still resolve the old values and display the proper user-friendly text, but those inactive items won't be available for selection when editing or creating new business objects.

:::note
To use your static enumeration elsewhere in the Xomega static model, you need to [associate it with a logical type](types#static-enumeration).
:::

### Additional properties

On top of the main `name` and `value` attributes, as well as the optional `active` flag, you can specify any number of additional properties for each enumeration item, including multi-value properties. They are typically used to filter the list of items or group them by certain properties.

#### Declaring properties

You need to declare additional properties in the nested `properties` node before the items. For each property, you need to add a `property` element, set its unique name in the `name` attribute, and optionally set the `default` attribute for the value to use when the property is not specified for an item. You can also set the `multi-value` attribute to indicate if the property allows multiple values for each item, as follows.

```xml
<enum name="operators">
<!-- highlight-next-line -->
  <properties>
    <property name="sort order">[...]
    <property name="addl props" default="0">[...]
    <property name="multival" default="0">[...]
<!-- highlight-start -->
    <property name="type" multi-value="true">
      <doc>
        <summary>Fully qualified type of the additional property, which this operator applies to.
It will also apply to all subclasses of this type. Multiple types can be specified.</summary>
The name should be in synch with the constant AttributeType defined in the OperatorProperty class.
      </doc>
    </property>
<!-- highlight-end -->
    <property name="exclude type" multi-value="true">[...]
    <property name="null check" default="0">[...]
  </properties>
  <item name="Is Null" value="NL">[...]
  ...
</enum>
```

As you can see above, you can also document your properties using the standard `doc` element, which is always a good idea.

#### Setting property values

Once you declare your additional properties for the enumeration, you can set them on each item by adding a nested `prop` element, setting the `ref` attribute to the name of the referenced property, and the `value` attribute to the actual value. If you want to specify multiple values for a multi-value property, then you can just add multiple `prop` elements for the same property, as illustrated below.

```xml
<enum name="operators">
  <properties>[...]
  ...
  <item name="Is Less Than" value="LT">
    <doc>
      <summary>Checks if the target value is less than the specified values.</summary>
    </doc>
<!-- highlight-start -->
    <prop ref="sort order" value="13"/>
    <prop ref="addl props" value="1"/>
    <prop ref="type" value="BigIntegerProperty"/>
    <prop ref="type" value="DecimalProperty"/>
    <prop ref="exclude type" value="BigIntegerKeyProperty"/>
    <prop ref="exclude type" value="IntegerKeyProperty"/>
    <prop ref="exclude type" value="SmallIntegerKeyProperty"/>
    <prop ref="exclude type" value="TinyIntegerKeyProperty"/>
<!-- highlight-end -->
  </item>
  <item name="Is Less Than Or Equal To" value="LE">[...]
  ...
</enum>
```

:::note
Xomega will provide Intellisense for selecting the property in the `ref` attribute along with the description of each property that you provided. It will also validate the `prop` elements and will show an error if the property name is invalid or if you supply multiple values for a property that is not configured as multi-value.
:::

### Inheriting static enums

Sometimes you need to define two or more enumerations that are very similar and contain almost the same, yet different, set of items so that you cannot just use the same enumeration. For example, you may need to configure some enumeration slightly differently for various installations of your app. Or you may just have enumerations that share a significant number of their items, such as when you have a field that requires special operators while still supporting the standard set of operators.

You can try to combine all items from such enumerations into one big enumeration and then differentiate using additional properties, but this can become unwieldy and may cause difficulties with proper validations. If you keep them as separate enumerations, though, it will result in duplication of the items and cause potential maintenance issues down the line.

Xomega model provides a powerful and elegant way to reduce the duplication in your static data by allowing you to **inherit** one enumeration from another and then **add, remove or override any items** in it. All you have to do is to set the `base` attribute on your `enum` element and specify another enumeration to inherit the items from, as follows.

```xml
<enum name="user operators" base="operators">[...]
```

#### Adding elements

To add a new item, an additional property, or a property value of a specific item, you just need to add the corresponding element using the standard enumeration structure. In the following example, the inherited enumeration `user operators` defines a new property `my prop`, adds a new item `Is Internal` and sets the value of the new `my prop` property for the existing item `Is Equal To`.

```xml
<enum name="user operators" base="operators">
  <properties>
<!-- highlight-next-line -->
    <property name="my prop"/>
  </properties>
<!-- highlight-next-line -->
  <item name="Is Internal" value="INT"/>
  <item name="Is Equal To" value="EQ">
<!-- highlight-next-line -->
    <prop ref="my prop" value="some value"/>
  </item>
</enum>
```

:::note
Your enumeration will override the existing elements of the base enumeration if you use the same name for an item or a property from the base enumeration or the same `ref` attribute for an item's property unless that property is multi-valued, in which case it will add a new value to the item's property.
:::

:::caution
Any new items will be added at the end of the base enumeration's items, and currently, there is no way to enforce a different order.
:::

#### Deleting elements

If you want to delete a certain item, property, or value of a property from the base enumeration, then you just need to add it to your enumeration and set the `overrideAction="delete"` attribute.

The following example shows how in our `user operators` enumerations, we delete the `sort order` property, which also removes its values from all the items, delete the `Last 30 Days` item, and some properties of the `Starts With` item.

```xml
<enum name="user operators" base="operators">
  <properties>
<!-- highlight-next-line -->
    <property name="sort order" overrideAction="delete"/>
  </properties>
<!-- highlight-next-line -->
  <item name="Last 30 Days" value="whatever" overrideAction="delete"/>
  <item name="Starts With" value="SW">
<!-- highlight-start -->
    <prop ref="addl props" value="whatever" overrideAction="delete"/>
    <prop ref="type" value="TextProperty" overrideAction="delete"/>
<!-- highlight-end -->
  </item>
</enum>
```

:::note
When your element is identified by a single attribute, e.g., a `name` for an item or property, or `ref` for a single-value property, then you can put anything in the other attributes, such as `value` when deleting that element.

However, if the element is identified by two attributes, such as both `ref` and `value` for multi-value properties, then you need to specify both of them in order to delete it from the enum, as illustrated by the `type` property of the `Starts With` item above.
:::

#### Replacing elements

Finally, if you want to replace an entire element from the base enumeration with the element that you specify in your custom enumeration, then you can set the `overrideAction="replace"` attribute on it.

For example, if you want to replace a `Starts With` item, including all its properties, with a custom value and your set of properties, without having to delete each individual child `prop` element, then you can do it as follows.

```xml
<enum name="user operators" base="operators">
<!-- highlight-start -->
  <item name="Starts With" value="STW" overrideAction="replace">
    <prop ref="null check" value="0"/>
  </item>
<!-- highlight-end -->
</enum>
```

#### Abstract enumerations

If you have two enumerations that share a number of items that you don't want to duplicate, then you can create a base enumeration with those items, which they both will inherit from. However, if that base enumeration is not intended to be used directly and only serves as the base for the other enumerations that inherit from it, then you can mark it with the `abstract="true"` attribute.

In the following example, both `numeric operators` and `date operators` inherit from the abstract `base operators` enumeration.

```xml
<!-- highlight-next-line -->
<enum name="base operators" abstract="true">[...]
<enum name="numeric operators" base="base operators">[...]
<enum name="date operators" base="base operators">[...]
```

:::tip
Marking base enumerations as abstract can help reduce the amount of generated code, as they will only contribute their items to other enumerations and will not themselves be output as separate enumerations.
:::

## Static data in DB tables

As you can see above, the Xomega model provides a flexible and powerful structure to describe arbitrary static data, which can be used then in your generated application and documentation. Your model can serve as the primary source of your static data and provide rigorous version control.

However, you may still need to store your static data in the database tables in order to make it available to any application logic in the database layer, such as database views, triggers, or stored procedures. Xomega model allows you to configure the objects that store static enumerations and associate them with each specific enumeration, as described below.

### Importing enums from tables{#import}

If you have an existing database for your Xomega application, and some tables in there already store static data, then you can import them as static enumerations into your Xomega model. To do that, you need to find the domain object that maps to your table and add a `sql:enum-items` config element to it, where you can set the source fields for the enumeration items using the following attributes.
- `item-value` - the field that stores item values. Required attribute, typically mapping to the ID field.
- `item-text` - the field that stores item texts. Required attribute, usually some name or description.
- `item-desc` - the field that stores item descriptions. Optional attribute used to import item documentation.

You can also import any other columns as additional properties of each item by adding a nested `sql:property` for each column, specifying the `field-name` attribute for the source field and the `property-name` for the enumeration property to store the values of that column.

For example, if you have a `SalesReason` table that contains static sales reason, and you want to import them as a static enumeration to the Xomega model, then you can add the following config to the corresponding `sales reason` domain object.

```xml
<object name="sales reason">
  <fields>
    <field name="sales reason id" type="sales reason" key="serial" required="true">[...]
    <field name="name" type="name" required="true">[...]
    <field name="reason type" type="name" required="true">[...]
    <field name="modified date" type="date time" required="true">[...]
  </fields>
  <config>
    <sql:table name="Sales.SalesReason"/>
<!-- highlight-start -->
    <sql:enum-items item-value="sales reason id" item-text="name">
      <sql:property field-name="reason type" property-name="type"/>
    </sql:enum-items>
<!-- highlight-end -->
  </config>
</object>
```

Note that we import the `reason type` values as an additional property named `type`. Once you configure the object like that, you can run the [Enumerations from Database generator](../../generators/model/enums), and it will add a separate file under the configured *Output Path*, which will have the imported enumerations with the same names as the source object, as illustrated below.

```xml
<!-- highlight-next-line -->
<enum name="sales reason">
  <properties>
<!-- highlight-next-line -->
    <property name="type"/>
  </properties>
  <item name="Price" value="1">[...]
  <item name="On Promotion" value="2">[...]
  <item name="Magazine Advertisement" value="3">[...]
<!-- highlight-start -->
  <item name="Television Advertisement" value="4">
    <prop ref="type" value="Marketing"/>
  </item>
<!-- highlight-end -->
  <item name="Manufacturer" value="5">[...]
  <item name="Review" value="6">[...]
  <item name="Demo Event" value="7">[...]
  <item name="Sponsorship" value="8">[...]
  <item name="Quality" value="9">[...]
  <item name="Other" value="10">[...]
  <config>
<!-- highlight-next-line -->
    <sql:enum-source items-object="sales reason"/>
  </config>
  <doc>
    <summary>Lookup table of customer purchase reasons.</summary>
  </doc>
</enum>
```

Note that the imported enumeration is automatically associated with the source object using the `sql:enum-source` config element.

:::tip
After importing your enums, you can move them to the appropriate model files and folders as needed unless you configured the *Output Path* of the generator to output them in the proper place right away. You can also start maintaining your enums in the Xomega model now to leverage version control and other static model features, such as enumeration inheritance.
:::

### Storing enums in tables

If you imported your static enumerations from database tables and started maintaining them in your Xomega model, or if you created them initially in the model, and need to load them into your database tables, then Xomega allows you to generate a SQL script that would reload your tables with the static data from your enumerations.

If you manually defined your enumerations in the model, then you need to configure the corresponding object that you want to reload with the enumeration items using the `sql:enum-items` config and any nested `sql:property` elements, the same way you would do it for [importing enumerations](#import). You also need to specify that object on the `sql:enum-source` config element of your enum, as follows.

```xml
<enum name="sales reason">
  ...
  <config>
<!-- highlight-next-line -->
    <sql:enum-source items-object="sales reason"/>
  </config>
</enum>
```

If your target object has any field that must be populated with a fixed value that is not stored as an additional property of your items, then you can add a nested `sql:fixed` config element and specify the field name and the value or a function in there.

For example, the `sales reason` object has a `modified date` field, which is not stored with the items of our static enumeration. To populate that column in the SQL script with the current date, you can set the fixed value for it to the `GetDate()` function, as follows.

```xml
<object name="sales reason">
  <fields>
    <field name="sales reason id" type="sales reason" key="serial" required="true">[...]
    <field name="name" type="name" required="true">[...]
    <field name="reason type" type="name" required="true">[...]
<!-- highlight-next-line -->
    <field name="modified date" type="date time" required="true">[...]
  </fields>
  <config>
    <sql:table name="Sales.SalesReason"/>
<!-- highlight-next-line -->
    <sql:enum-items item-value="sales reason id" item-text="name">
      <sql:property field-name="reason type" property-name="type"/>
<!-- highlight-next-line -->
      <sql:fixed field-name="modified date" fixed-value="GetDate()"/>
    </sql:enum-items>
  </config>
</object>
```

If you run the [Enumeration Reload SQL generator](../../generators/enums/enum-sql), then it will create a SQL script to reload static enumerations, as shown below.

```sql title="reload_enumerations.sql"
...
delete from Sales.SalesReason;

/* highlight-start */
insert into Sales.SalesReason ([SalesReasonID], [Name], [ReasonType], [ModifiedDate])
  values (1, 'Price', 'Other', GetDate());
/* highlight-end */
insert into Sales.SalesReason ([SalesReasonID], [Name], [ReasonType], [ModifiedDate])
  values (2, 'On Promotion', 'Promotion', GetDate());
...
```

Once you generate the SQL script, you can review it and run it against your databases in various environments to reload the static data.

## Generic dictionary tables

Instead of storing each enumeration in a separate table, it's common within large projects to define some generic dictionary tables that store the items and their property values for different types of enumerations in the same tables.

If your database doesn't already have such generic dictionary tables, then Xomega can help you create and configure such tables. All you need to do is to right-click on the *Framework* folder of the model project, select *Add > New Item...*, and pick the *Dictionary Object* item template.

### Dictionary items

The default dictionary object for storing enumeration items will have a composite key that consists of both the enumeration name and the code of the item, which will be stored as a string. It will also store the text and a long description of each item, as well as the date when the item was last reloaded in the table.

The `dictionary` object will be configured with the `sql:enum-items` element similar to the one you specify on the objects for individual enumerations, as described above. One notable difference is that it will have the `enum-name` attribute set to the field that contains the name of the enumeration the item belongs to, as shown below.

```xml
<module xmlns="http://www.xomega.net/omodel"
        xmlns:sql="http://www.xomega.net/sql"
        name="Framework">
  <types>[...]
  <fieldsets>
<!-- highlight-next-line -->
    <fieldset name="dictionary key">
      <field name="enumeration" type="enum name"/>
      <field name="item code" type="enum item code"/>
    </fieldset>
  </fieldsets>
  <objects>
<!-- highlight-next-line -->
    <object name="dictionary">
      <fields>
        <fieldset ref="dictionary key" key="supplied"/>
        <field name="text" type="enum item text"/>
        <field name="description" type="enum item desc"/>
        <field name="reload date" type="date time"/>
      </fields>
      <config>
<!-- highlight-start -->
        <sql:enum-items default="true" enum-name="enumeration" item-value="item code"
                        item-text="text" item-desc="description">
          <sql:fixed field-name="reload date" fixed-value="GetDate()"/>
        </sql:enum-items>
<!-- highlight-end -->
      </config>
      <subobjects>[...]
    </object>
  </objects>
</module>
```

Also note the `default="true"` attribute set on the `sql:enum-items` config above. This configuration allows you to designate this object as the storage for any enumeration that is not explicitly configured with the `sql:enum-source` element, which saves you from specifying it on every enumeration.

:::tip
You can customize the default field names, as well as their types and lengths, as needed for your project.
:::

:::note
If your database already has a table that stores items for multiple enumerations, then you can just add the `sql:enum-items` element to the corresponding object and configure its attributes as appropriate. Xomega will provide the Intellisense and validation for those attributes.
:::

### Item properties

To store the values of any additional properties of the enumeration items, the default `dictionary` object defines a subobject `property` that stores the `property name` and `property value` as strings. Since the `property name` can have duplicate values for the same enumeration item, if the property is multi-value, it cannot uniquely identify the record, so the subobject has a serial `id` field as a key.

The `property` object is also configured with a `sql:enum-item-properties` element, which tells Xomega which fields of the object, including implicitly included key fields of the parent object, map to the corresponding attributes of the enumeration items and the property value, as illustrated below.

```xml
<!-- highlight-next-line -->
<object name="dictionary">
  <fields>[...]
  <config>[...]
  <subobjects>
<!-- highlight-next-line -->
    <object name="property">
      <fields>
        <field name="id" type="enum item property" key="serial"/>
        <field name="property name" type="enum name"/>
        <field name="property value" type="enum item text"/>
      </fields>
      <config>
<!-- highlight-start -->
        <sql:enum-item-properties default="true" enum-name="enumeration" item-value="item code"
                                  property-name="property name" property-value="property value"/>
<!-- highlight-end -->
      </config>
    </object>
  </subobjects>
</object>
```

:::note
If your `property` object needs to have another field that should be populated with a fixed value, such as a `reload date`, then you can also add a corresponding `sql:fixed` config element for that field, as follows.

```xml
  <sql:enum-item-properties default="false" enum-name="enumeration" item-value="item code"
                            property-name="property name" property-value="property value">
<!-- highlight-next-line -->
    <sql:fixed field-name="reload date" fixed-value="GetDate()"/>
  </sql:enum-item-properties>
```
:::

Again, the `default="true"` attribute above indicates that all additional properties for any enumeration will be stored in this object unless the object is explicitly configured for that enumeration using the `item-properties-object` attribute of the `sql:enum-source` config element, as follows.

```xml
<enum name="sales order status">
  <properties>[...]
  <item name="In process" value="1">[...]
  ...
  <item name="Cancelled" value="6">[...]
  <config>
    <sql:enum-source items-object="dictionary"
<!-- highlight-next-line -->
                     item-properties-object="dictionary.property"/>
  </config>
</enum>
```

:::note
Just like with the `dictionary` object, you can customize the `property` subobject to use different field names or types. And if you already have an existing table that stores additional property values in your database, then you can just configure that object with the `sql:enum-item-properties` element.
:::

### Dictionary service

If you define and maintain your static enumerations in your model, then you can provide access to the enumeration items and their properties from your application by generating [Enumeration Constants](../../generators/enums/enum-const) and an embedded resource with [Enumeration Data XML](../../generators/enums/enum-xml), which you then load into a Xomega Framework lookup cache using a built-in XML cache loader.

For such enumerations, the only reason to store their items and properties in generic dictionary tables would be to provide access to them from any database layer logic, such as stored procedures or triggers.

If, however, your generic dictionary tables store any enumerations that you don't maintain in the model, then you may need to use those tables as a source of your static data for the application.

Xomega model allows you to create a service operation that returns generic dictionary items for multiple enumerations, and for each item it would include a nested list of property values in a name/value format.

To generate a cache loader for such an operation, which will allow you to load the lookup cache from the dictionary tables, you need to use the same `xfk:enum-cache` config element that you use for [standard dynamic enumerations](../modeling/services#dynamic-enumerations). However, instead of the `enum-name` attribute, you'd specify the `enum-param` attribute, which will indicate which output parameter contains the enumeration name for each item.

Also, to indicate which output parameter contains the list of additional properties for each item, you will need to add a nested config element `xfk:properties`, set that structure parameter in the `properties-struct` attribute, and indicate which parameters of that structure contain the name and value of the additional property using the `name-param` and `value-param` attributes respectively.

The following example illustrates this `read` operation on the `dictionary` object, which returns items for multiple enumerations and their additional properties as a child name/value list, and configures it for the [generation of a Lookup Cache Loader](../../generators/enums/cache-loaders).

```xml
<!-- highlight-next-line -->
<object name="dictionary">
  <fields>[...]
  <operations>
<!-- highlight-next-line -->
    <operation name="read">
      <output list="true">
<!-- highlight-next-line -->
        <param name="enumeration" type="enum name"/>
        <param name="item code" type="enum item code"/>
        <param name="text"/>
<!-- highlight-start -->
        <struct name="properties" list="true">
          <param name="property" type="enum name"/>
          <param name="value" type="enum item text"/>
        </struct>
<!-- highlight-end -->
      </output>
      <config>
<!-- highlight-start -->
        <xfk:enum-cache enum-param="enumeration" id-param="item code" desc-param="text">
          <xfk:properties properties-struct="properties" name-param="property" value-param="value"/>
        </xfk:enum-cache>
<!-- highlight-end -->
      </config>
    </operation>
  </operations>
  <config>[...]
  <subobjects>[...]
</object>
```

:::note
This `read` operation will be automatically included when you add a new dictionary object to your model project from a Visual Studio item template. As usual, you can customize it to change the names of the output parameters or their types.
:::

:::caution
Xomega will not be able to automatically generate the service implementation code to populate the list of additional properties from the subobject, so you will need to add a custom implementation, as illustrated below.
:::

```cs
public partial class DictionaryService : BaseService, IDictionaryService
{
    public virtual async Task<Output<ICollection<Dictionary_ReadOutput>>>
        ReadAsync(CancellationToken token = default)
    {
        ...
        var qry = from obj in src
            select new Dictionary_ReadOutput() {
                Enumeration = obj.Enumeration,
                ItemCode = obj.ItemCode,
                Text = obj.Text,
/* highlight-start */
                // CUSTOM_CODE_START: set the Properties output parameter of Read operation below
                Properties = obj.PropertyObjectList.Select(p =>
                    new Dictionary_ReadOutput_Properties() {
                        Property = p.PropertyName,
                        Value = p.PropertyValue
                }).ToList(), // CUSTOM_CODE_END
/* highlight-end */
            };
        ...
    }
}
```

## Item text localization

Normally, the default display text for each enumeration item comes either from the item's `name` attribute or from the `text` child element, where provided. However, for applications running in multiple locales, you need to be able to store translations of the text for each item in various supported languages.

Xomega model supports multiple ways to provide the localized text for each item depending on whether the items are defined in the static model or come dynamically from the database, as described in the sections below.

### Localizing static items

When you have the items of your enumerations defined statically in the model, you can provide the localized display text for each item either directly in the model in additional properties or separately in the standard resource files.

#### Translations in resources

When you provide localized text in the standard resource files, you don't have to change anything in the Xomega model. Instead, for each enumeration item, you need to specify a resource entry with a key `Enum_<EnumName>.<ItemValue>` and the localized text as the value. Xomega Framework will use this key automatically to look up the localized text, as described [here](../../framework/common-ui/lookup#localizing-static-data).

The following examples illustrate a sample `error severity` enumeration, the corresponding default resource file, as well as ones for the German and Bulgarian languages.

<Tabs>
  <TabItem value="xom" label="error_log.xom">

```xml
<enum name="error severity">
  <item name="Error" value="1"/>
  <item name="Warning" value="2"/>
  <item name="Info" value="3"/>
</enum>
```

  </TabItem>
  <TabItem value="en" label="Resources.resx">

|Name|Value|Comment|
|-|-|-|
|Enum_error severity.1|Error|
|Enum_error severity.2|Warning|
|Enum_error severity.3|Info|

  </TabItem>
  <TabItem value="de" label="Resources.de.resx">

|Name|Value|Comment|
|-|-|-|
|Enum_error severity.1|Fehler|
|Enum_error severity.2|Warnung|
|Enum_error severity.3|Die Info|

  </TabItem>
  <TabItem value="bg" label="Resources.bg.resx">

|Name|Value|Comment|
|-|-|-|
|Enum_error severity.1|Грешка|
|Enum_error severity.2|Внимание|
|Enum_error severity.3|Информация|

  </TabItem>
</Tabs>

:::tip
The default resource file can be generated automatically from your enumerations using the [Labels Resources generator](../../generators/presentation/common/resources#static-enumerations), which you can then hand off for translation into additional languages.
:::

#### Translations in item properties

Instead of supplying localized resource files, you can also specify localization text for each item in additional properties that are named `lang-<Culture Name>` for each supported language/culture. You can use either just a language ISO code there, such as `lang-en` for English, or country-specific overrides, e.g., `lang-en-US`, and Xomega Framework will automatically handle such [language properties](../../framework/common-ui/lookup#localizing-dynamic-data).

The following example demonstrates the same `error severity` enumeration with German and Bulgarian localization specified in the additional properties.

```xml
<enum name="error severity">
  <properties>
<!-- highlight-next-line -->
    <property name="lang-de"/>
    <property name="lang-bg"/>
  </properties>
  <item name="Error" value="1">
<!-- highlight-next-line -->
    <prop ref="lang-de" value="Fehler"/>
    <prop ref="lang-bg" value="Грешка"/>
  </item>
  <item name="Warning" value="2">
<!-- highlight-next-line -->
    <prop ref="lang-de" value="Warnung"/>
    <prop ref="lang-bg" value="Внимание"/>
  </item>
  <item name="Info" value="3">
<!-- highlight-next-line -->
    <prop ref="lang-de" value="Die Info"/>
    <prop ref="lang-bg" value="Информация"/>
  </item>
</enum>
```

:::caution
If your localization process involves sending texts for translation to others, then using **standard resource files may work better** for you since the translators may not be familiar with the structure of the Xomega static data model.
:::

### Localizing dynamic items

When your enumeration items are not statically defined in your model but are sourced from a database and, therefore, can be updated dynamically, you can no longer use the static resource files for the localized text. The only option is to provide the text in additional attributes that use the `lang-<Culture Name>` naming convention.

For each item stored in the database, you can either provide translations in a separate column for each supported language or read them from a child table, where the list of supported languages can also be dynamic.

#### Translations in separate columns

If you store translations for each supported language in a separate column, then you can define those columns on the same object that stores the enumerated items. In the `read enum` operation that returns those items, you will need to add output parameters for each language using the `lang-<Culture Name>` convention and make sure they return the localized values for each language.

In the following example, we store a list of address types with their names in a database table and specify additional German and Spanish translations in the `name-de` and `name-es` fields, respectively.

We return those fields as the `lang-de` and `lang-es` parameters in the `read enum` operation. However, since these names don't match, we need to map them in the custom code of the generated `AddressTypeService` class.

<Tabs>
  <TabItem value="xom" label="address_type.xom">

```xml
<object name="address type">
  <fields>
    <field name="address type id" type="address type" key="serial" required="true"/>
    <field name="name" type="name" required="true"/>
<!-- highlight-start -->
    <field name="name-de" type="name"/>
    <field name="name-es" type="name"/>
<!-- highlight-end -->
  </fields>
  <operations>
<!-- highlight-next-line -->
    <operation name="read enum">
      <output list="true">
        <param name="address type id"/>
        <param name="name"/>
<!-- highlight-start -->
        <param name="lang-de" type="name"/>
        <param name="lang-es" type="name"/>
<!-- highlight-end -->
      </output>
      <config>
        <xfk:enum-cache enum-name="address type" id-param="address type id" desc-param="name"/>
      </config>
    </operation>
  </operations>
</object>
```
  </TabItem>
  <TabItem value="svc" label="AddressTypeService.cs">

```cs
public virtual async Task<Output<ICollection<AddressType_ReadEnumOutput>>>
// highlight-next-line
    ReadEnumAsync(CancellationToken token = default)
{
    ...
    var qry = from obj in ctx.AddressType
              select new AddressType_ReadEnumOutput() {
                  AddressTypeId = obj.AddressTypeId,
                  Name = obj.Name,
                  // CUSTOM_CODE_START: set the LangDe output parameter of ReadEnum operation below
// highlight-next-line
                  LangDe = obj.NameDe, // CUSTOM_CODE_END
                  // CUSTOM_CODE_START: set the LangEs output parameter of ReadEnum operation below
// highlight-next-line
                  LangEs = obj.NameEs, // CUSTOM_CODE_END
              };
    var res = await qry.ToListAsync(token);
    ...
}
```

  </TabItem>
  <TabItem value="cl" label="AddressTypeReadEnumCacheLoader.cs">

```cs
protected override async Task LoadCacheAsync(string tableType, CacheUpdater updateCache,
                                             CancellationToken token = default)
{
    var data = new Dictionary<string, Dictionary<string, Header>>();
    var output = await ReadEnumAsync(token);
    ...
    foreach (var row in output.Result)
    {
        string type = "address type";
        if (!data.TryGetValue(type, out Dictionary<string, Header> tbl))
            data[type] = tbl = new Dictionary<string, Header>();

        string id = "" + row.AddressTypeId;
        if (!tbl.TryGetValue(id, out Header h))
            tbl[id] = h = new Header(type, id, row.Name);

// highlight-start
        h.AddToAttribute("lang-de", row.LangDe);
        h.AddToAttribute("lang-es", row.LangEs);
// highlight-end
    }
    ...
}
```

  </TabItem>
</Tabs>

As you can see, the generated `AddressTypeReadEnumCacheLoader` class will add those parameters as additional attributes to the `Header` objects, which will handle them automatically based on their names.

#### Translations in a child table

If you want to support a dynamic list of languages rather than a preset list, then you need to store your translations in a child table, where each row provides the current item's translation into a specific language. You can return them as a list of nested structures in your `read enum` operation, and make sure that the language parameter is returned in the proper format `lang-<Culture Name>`.

In order for the generated cache loader to properly add the nested records as additional attributes of the `Header` objects, you need to add the `xfk:properties` child element to the `xfk:enum-cache` definition, where you specify which parameter has the attribute name and which one has the value.

In the following example, we added a `translation` subobject of the `address type` that has `lang` and `text` fields. You can store the value in the `lang` field as just the culture name, such as `en` or `en-US`, but you'll need to convert it in the `AddressTypeService` to the `lang-<Culture Name>` format when you return it as part of the nested `translations` list in the `read enum` operation.

<Tabs>
  <TabItem value="xom" label="address_type.xom">

```xml
<object name="address type">
  <fields>
    <field name="address type id" type="address type" key="serial" required="true"/>
    <field name="name" type="name" required="true"/>
  </fields>
  <operations>
    <operation name="read enum">
      <output list="true">
        <param name="address type id"/>
        <param name="name"/>
<!-- highlight-start -->
        <struct name="translations" list="true">
          <param name="lang" type="string10"/>
          <param name="text" type="name"/>
        </struct>
<!-- highlight-end -->
      </output>
      <config>
        <xfk:enum-cache enum-name="address type" id-param="address type id" desc-param="name">
<!-- highlight-next-line -->
          <xfk:properties properties-struct="translations" name-param="lang" value-param="text"/>
        </xfk:enum-cache>
      </config>
    </operation>
  </operations>
  <subobjects>
<!-- highlight-next-line -->
    <object name="translation">
      <fields>
<!-- highlight-start -->
        <field name="lang" type="string5" key="supplied"/>
        <field name="text" type="name"/>
<!-- highlight-end -->
      </fields>
    </object>
  </subobjects>
</object>
```

  </TabItem>
  <TabItem value="svc" label="AddressTypeService.cs">

```cs
public virtual async Task<Output<ICollection<AddressType_ReadEnumOutput>>>
// highlight-next-line
    ReadEnumAsync(CancellationToken token = default)
{
    ...
    var qry = from obj in ctx.AddressType
              select new AddressType_ReadEnumOutput() {
                  AddressTypeId = obj.AddressTypeId,
                  Name = obj.Name,
                  // CUSTOM_CODE_START: set the Translations output parameter of ReadEnum operation below
// highlight-start
                  Translations = obj.TranslationObjectList.Select(tr =>
                                      new AddressType_ReadEnumOutput_Translations() {
                                          Lang = $"lang-{tr.Lang}",
                                          Text = tr.Text
                                  }).ToList(), // CUSTOM_CODE_END
// highlight-end
              };
    var res = await qry.ToListAsync(token);
    ...
}
```

  </TabItem>
  <TabItem value="cl" label="AddressTypeReadEnumCacheLoader.cs">

```cs
protected override async Task LoadCacheAsync(string tableType, CacheUpdater updateCache,
                                             CancellationToken token = default)
{
    var data = new Dictionary<string, Dictionary<string, Header>>();
    var output = await ReadEnumAsync(token);
    ...
    foreach (var row in output.Result)
    {
        string type = "address type";
        if (!data.TryGetValue(type, out Dictionary<string, Header> tbl))
            data[type] = tbl = new Dictionary<string, Header>();

        string id = "" + row.AddressTypeId;
        if (!tbl.TryGetValue(id, out Header h))
            tbl[id] = h = new Header(type, id, row.Name);

// highlight-start
        foreach (AddressType_ReadEnumOutput_Translations p in row.Translations)
            h.AddToAttribute(p.Lang, p.Text);
// highlight-end
    }
    ...
}
```

  </TabItem>
</Tabs>

As you can see, the generated `AddressTypeReadEnumCacheLoader` class will add the rows from the `Translations` list as additional attributes to the `Header` objects, which will handle them automatically based on their names.
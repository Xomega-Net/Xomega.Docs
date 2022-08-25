---
sidebar_position: 4
---

# Specialty Properties

In addition to standard data properties Xomega Framework includes some specialized properties as described below.

## ComboProperty

Sometimes you have several data properties that you want display in a combined readonly way using a certain format. For example, if you have individual address fields, such as street address, city, state and zip code, then you may want to display them as one field, e.g. `{street address}, {city}, {state} {zip code}`.

Technically, you can just output a string that combines the display values of each component property using the needed format, but this has the following issues:
1. You cannot bind a property-bindable UI control to that string.
1. That string would not get automatically updated when any of the individual property changes.
1. When no address is available, your string will be displayed as a bunch of commas and spaces, e.g. ", ,  ";

To address these issues, Xomega Framework provides a `ComboProperty` class, which combines several other data properties. To set those individual properties you can call the `SetComponentProperties` on your combo property, and pass them as parameters or as an array of properties. You should also set the `Format` field of your combo property that uses indexes of those component properties.

The `ComboProperty` will listen to the changes in its component properties and will fire its own property change event as a result, which will cause the bound UI control to refresh itself. If all component properties have `null` values, then the combo property will be also considered to have a `null` value, which will be [displayed accordingly](base#null-values).

In the following example we create a `ComboProperty` for a person's full name that displays their last name followed by the first name with a comma in between.

```cs
FullNameProperty = new ComboProperty(this, "FullName");
FullNameProperty.SetComponentProperties(LastNameProperty, FirstNameProperty);
FullNameProperty.Format = "{0}, {1}"; // display as "Doe, Joe"
```

:::tip
As an alternative to the `ComboProperty` you can use a regular `TextProperty`, and set its [computed value](base#computed-value) to an expression built from the component properties. The value expression would have to check whether `IsNull` for **all** individual properties returns `true`, and then return `null` as a result.
:::

## OperatorProperty

`OperatorProperty` is a subclass of the [`EnumProperty`](enum) that is used in search criteria data objects to allow selecting an operator for specific criteria fields.

### Criteria value properties

Each operator property may be associated with up to two additional data properties that would hold the actual values for the criteria. For example, *Is Equal To* operator requires one extra property for the criteria value, while *Is Between* operator requires two properties for the start and the end of the range. Some operators, such as *Is Null*, require no additional properties.

By default, the `OperatorProperty` will try to find the corresponding additional properties using the following naming conventions.
1. If its name ends with *Operator*, such as *OrderDateOperator*, then the name of the first additional property will be the string before *Operator*, i.e. *OrderDate*.
1. The name of the second additional property will be the name of the first property with a *2* at the end, e.g. *OrderDate2*.
1. The actual additional properties will be looked up in the parent data object using the above names.

You can also explicitly specify the names of the first and second additional properties by setting the `AdditionalPropertyName` and `AdditionalPropertyName2` fields respectively in the `Initialize` method of the parent data object, as follows.

```cs title="OrderCriteriaObject.cs"
protected override void Initialize()
{
    OrderDateOperatorProperty = new OperatorProperty(this, "OrderDateOperator")
    {
        EnumType = "operators",
/* highlight-start */
        AdditionalPropertyName = "OrderDateFrom",
        AdditionalPropertyName2 = "OrderDateTo"
/* highlight-end */
    };
}
```

:::caution
If you set the additional property names in the data object's overridden `OnInitialized` method instead, then make sure that you do it **before calling the `base.OnInitialized()`** method.
:::

### Operator lookup table

The complete list of operators for the property should come from a cached [lookup table](../lookup#lookup-table) that you specify when you set the `EnumType` field, such as the "*operators*" table above. The "*operators*" lookup table may contain all possible operators, and can be reused between multiple operator properties, because the `OperatorProperty` will display only the relevant operators based on its additional properties. 

For example, when your operator property has only one additional property, it won't show the *Is Between* operator that requires two values. If the additional property is not multi-valued, then it won't display multi-value operators, such as *Is One Of* or *Is None Of*. And if the additional property is of type `DateTimeProperty`, then it will show type-specific operators such as *Is Later Than*, rather than a similar operator *Is Greater Than* for numeric properties.

When the user selects a specific operator, the `OperatorProperty` will ensure that any additional properties for that operator are visible and required. Any extra additional properties that are not needed for the operator will be made hidden and not required, and their value(s) will be cleared.

### Operator attributes

In order to determine which operators are applicable to the associated additional properties, the `OperatorProperty` uses a number of [additional attributes](../lookup#additional-attributes) on the operator headers. It also defines constants for the names of those attributes, as follows.

- `AttributeAddlProps` ("*addl props*") - attribute that stores the number of additional properties that the operator requires: 0 (e.g. *IsNull*), 1 (e.g. *Equals*) or 2 (e.g. *Between*).
- `AttributeMultival` ("*multival*") - attribute that stores 1 or 0 to indicate if the additional property can be multi-valued.
- `AttributeType` ("*type*") - attribute that stores a fully qualified type of the additional property, which this operator applies to. It will also apply to all subclasses of this type. Multiple types can be specified.
- `AttributeExcludeType` ("*exclude type*") - attribute that stores a fully qualified type of the additional property, which this operator does not apply to. It won't also apply to all subclasses of this type. Multiple exclude types can be specified. Exclude types should be generally more concrete than include types.
- `AttributeSortOrder` ("*sort order*") - attribute that stores the sort order of the operators with respect to other operators.
- `AttributeNullCheck` ("*null check*") - attribute that stores 1 for null check operators (*Is Null* or *Is Not Null*) to enable easily hiding or showing them. You can control whether or not your `OperatorProperty` shows null checks by setting its `HasNullCheck` field. It's set to `false` by default, but you can set it to `true` if your field can be `null`, and if you want to allow the users to explicitly search for null values in that field.

### Loading operators table

You can load the lookup table for operators configured with all these attributes into your lookup cache using any cache loader. For example, you can define it as embedded XML resource file in the proper format, and load it using an [XmlLookupCacheLoader](../lookup#static-xml-data-loader).

<details>

<summary>Here is a sample XML that illustrates configuration of the lookup data for operators, which you can load into the lookup cache.</summary>

```xml
<enums xmlns="http://www.xomega.net/omodel">
<!-- highlight-next-line -->
  <enum name="operators">
    <properties>
      <property name="sort order"/>
      <property name="addl props" default="0"/>
      <property name="multival" default="0"/>
      <property name="type" multi-value="true"/>
      <property name="exclude type" multi-value="true"/>
      <property name="null check" default="0"/>
    </properties>
<!-- highlight-next-line -->
    <item name="Is Null" value="NL">
      <prop ref="sort order" value="00"/>
      <prop ref="null check" value="1"/>
    </item>
<!-- highlight-next-line -->
    <item name="Is Not Null" value="NNL">
      <prop ref="sort order" value="01"/>
      <prop ref="null check" value="1"/>
    </item>
<!-- highlight-next-line -->
    <item name="Is Equal To" value="EQ">
      <prop ref="sort order" value="10"/>
      <prop ref="addl props" value="1"/>
    </item>
<!-- highlight-next-line -->
    <item name="Is One Of" value="In">
      <prop ref="sort order" value="10"/>
      <prop ref="addl props" value="1"/>
      <prop ref="multival" value="1"/>
    </item>
<!-- highlight-next-line -->
    <item name="Is Less Than" value="LT">
      <prop ref="sort order" value="13"/>
      <prop ref="addl props" value="1"/>
      <prop ref="type" value="BigIntegerProperty"/>
      <prop ref="type" value="DecimalProperty"/>
      <prop ref="exclude type" value="BigIntegerKeyProperty"/>
      <prop ref="exclude type" value="IntegerKeyProperty"/>
      <prop ref="exclude type" value="SmallIntegerKeyProperty"/>
      <prop ref="exclude type" value="TinyIntegerKeyProperty"/>
    </item>
<!-- highlight-next-line -->
    <item name="Last 30 Days" value="[bod-30d,ct]">
      <prop ref="sort order" value="07"/>
      <prop ref="type" value="DateTimeProperty"/>
    </item>
<!-- highlight-next-line -->
    <item name="Is Later Than" value="Later">
      <prop ref="sort order" value="14"/>
      <prop ref="addl props" value="1"/>
      <prop ref="type" value="DateTimeProperty"/>
    </item>
<!-- highlight-next-line -->
    <item name="Contains" value="CN">
      <prop ref="sort order" value="12"/>
      <prop ref="addl props" value="1"/>
      <prop ref="type" value="TextProperty"/>
      <prop ref="exclude type" value="EnumProperty"/>
    </item>
<!-- highlight-next-line -->
    <item name="Is Between" value="BW">
      <prop ref="sort order" value="20"/>
      <prop ref="addl props" value="2"/>
      <prop ref="type" value="IntegerProperty"/>
      <prop ref="type" value="DecimalProperty"/>
      <prop ref="type" value="DateTimeProperty"/>
    </item>
  </enum>
</enums>
```

</details>

:::tip
When you create a Xomega solution, it will have an initial set of operators in its static model. You can edit them as needed, and then **generate an XML resource file**, like the one shown above, which you can easily load into the global lookup cache.
:::
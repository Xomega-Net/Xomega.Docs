---
sidebar_position: 3
---

# Domain Model

Xomega allows you to model your business domain following Domain Driven Design principles. The main elements of a Xomega domain model are domain objects with their fields, which map to Entity Framework entities with their properties and to database tables with their columns.

It also includes reusable field sets that you can define only in the Xomega model to help you create a domain model, but they don't have a direct representation in any generated code.

## Field-sets and fields

Fieldsets are named groups of fields that you can define in the Xomega model under the `fieldsets` element nested within the `module` element, which you can then reference in the definitions of your domain objects. This allows you to easily add certain facets to your domain objects in an aspect-oriented way that would be consistent across your domain.

For example, if all or most of your domain objects must have a set of standard audit fields, such as the user who created or last modified it, as well as the creation and last modification time stamps, then you can just define such a fieldset in your model, as follows.

```xml
<module>
  <fieldsets>
<!-- highlight-next-line -->
    <fieldset name="audit fields">
      <field name="create date" type="date time" required="true"/>
      <field name="create user" type="user" required="true"/>
      <field name="modified date" type="date time" required="true"/>
      <field name="modified user" type="user" required="true"/>
    </fieldset>
  </fieldsets>
</module>
```

When you add this field set to individual objects, they will automatically have those audit fields. If later on, you will need to include any additional fields to the audit, e.g., the ID of a program or application that created or updated the object, then you'll be able to add them to that field set, and they will be automatically included in your domain objects.

:::tip
Oftentimes, you also have some domain objects that cannot be modified since they are only created or deleted. To support such objects, you may want to define a separate field set with only the *create* audit fields.
:::

Another usage for fieldsets is to allow defining composite object keys, as you will see later.

### Field configurations

In addition to the name, you can specify the logical type for the field and whether or not it's required right on the `field` element in the `type` and `required` attributes, respectively.

You can also supply a description and detailed documentation for the field in the standard nested `doc` element. In addition to the field's `doc`, Xomega may also use documentation on the field's type when generating documentation for the field.

Any additional field configuration is specified under the nested `config` element in a separate namespace.

For example, you can configure some properties of the corresponding SQL Server column for any field by setting the following attributes on its `sql:column` element:
- `name` - the name of the database column for the field when not derived from the field's name.
- `mode` - field persistence mode. Set to `none` to indicate the field is not persisted in the database.
- `default` - the default value or expression for the database column for generating a DB script.
- `serial` - identity specification for the column for generating a DB script.
- `computed` - computed specification for the column for generating a DB script.

The snippet below demonstrates how to set the DB column configuration.

```xml
    ...
    <field name="freight" type="money" required="true">
      <config>
<!-- highlight-next-line -->
        <sql:column name="Freight" default="(0.00)"/>
      </config>
    </field>
    <field name="total due" type="money" required="true">
      <config>
<!-- highlight-next-line -->
        <sql:column name="TotalDue" computed="(isnull(([SubTotal]+[TaxAmt])+[Freight],(0)))"/>
      </config>
      <doc>
        <summary>Total due from customer. Computed as Subtotal + TaxAmt + Freight.</summary>
      </doc>
    </field>
    ...
```

Similarly, you can set an EDM concurrency mode for a field as follows.

```xml
    <field name="rowguid" type="guid" required="true">
      <config>
        <sql:column name="rowguid" default="newid()"/>
<!-- highlight-next-line -->
        <edm:property ConcurrencyMode="Fixed"/>
      </config>
    </field>
```

## Domain objects

You can define domain objects in the Xomega model with an `object` element either under the `objects` node of the top-level `module` element or within the `subobjects` element of its parent aggregate object. The object's `name` should be unique either globally or within its parent object.

The following snippet shows the object's possible elements in the order they must be listed when present, provided that you cannot have more than one element of each kind.

```xml
<module xmlns="http://www.xomega.net/omodel"
        name="my module">
  <objects>
    <object name="my object">

      <fields>[...] <!-- fields and fieldsets of the object -->

      <operations>[...]  <!-- operations supported by the object -->

      <config>[...]  <!-- additional object configuration -->

      <doc>[...]  <!-- object documentation -->

      <subobjects>[...]  <!-- subobjects of an aggregate object -->

    </object>
  </objects>
</module>
```

A domain object is defined by its `fields` element, which should contain a list of fields or fieldsets that make up the object, as illustrated below.

```xml
<object name="sales order">
<!-- highlight-next-line -->
  <fields>
    <field name="sales order id" type="sales order" key="serial" required="true"/>
    <field name="order date" type="date time" required="true"/>
    <field name="customer id" type="customer" required="true"/>
    <fieldset ref="audit fields"/>
  </fields>
</object>
```

### Simple primary key{#pk1}

As illustrated in the previous snippet, for domain objects with a simple primary key, the key field should be marked with a `key` attribute, which can be set to one of the following values:
- `serial` - the key is auto-generated by the system, usually by incrementing the values.
- `supplied` - the key is manually supplied by the user when creating new objects.
- `reference` - the key is just a reference to another object's primary key.

:::note
For most of the domain objects, the key is typically auto-generated and set to `serial`. You may have some objects that have user-supplied keys, but those tend to be smaller subobjects of an aggregate object since changing a key is usually non-trivial. The `reference` type of keys is typically used on subobjects that reference other aggregate root objects.
:::

Xomega model requires you to use a **dedicated logical type** for your key fields. More specifically, it validates that the logical type of a `serial` or `supplied` key field cannot be used on more than one object, which allows Xomega to uniquely identify the object by just the logical type of its key.

This, in turn, allows you to easily **establish an implicit relationship** to your domain object from any other object by simply using the key's logical type, or its subtype, on any field of the other object. If that field also needs to be a key field of the other object, then you would set the `key="reference"` attribute on it.

:::note
You cannot have more than one field marked with a `key` attribute. If your object has multiple keys, then read the following section on composite primary keys.
:::

### Composite primary key{#pk2}

For domain objects with a composite primary key that consists of more than one field, you must define a **dedicated fieldset** with those fields and add it to the object with a `key` attribute set to one of the following values:
- `supplied` - the key is supplied by the user when creating new objects.
- `reference` - the key is a reference to another object's composite primary key.

In the following example, we define a fieldset `email address`, which we then use as a key on the `email address` object.

```xml title="email_address.xom"
<module xmlns="http://www.xomega.net/omodel"
        name="person">
  <types>
    <type name="email" base="string" size="50"/>
  </types>
  <fieldsets>
<!-- highlight-next-line -->
    <fieldset name="email address">
      <field name="business entity id" type="person" required="true"/>
      <field name="email address id" type="integer" required="true"/>
    </fieldset>
  </fieldsets>
  <objects>
    <object name="email address">
      <fields>
<!-- highlight-next-line -->
        <fieldset ref="email address" key="supplied" required="true"/>
        <field name="email address" type="email"/>
        <field name="rowguid" type="guid" required="true"/>
        <field name="modified date" type="date time" required="true"/>
      </fields>
    </object>
  </objects>
</module>
```

Just like with the simple primary keys, Xomega requires that any `supplied` key fieldset is only used on one object, which allows Xomega to uniquely identify that object by that fieldset alone. So, in order to add a reference to your object from any other object, you just need to add its key field set to the other object's fields, and this will establish an implicit relationship between them.

:::tip
A lot of domain objects with composite keys typically represent sub-objects of another aggregate object in your domain model. If you define such objects as **subobjects** in the Xomega model, then they'll automatically include the parent's object key, which could minimize the need to use composite keys in your domain objects.
:::

### Object fieldsets

When you add a field set to your domain object, you basically include all the fields defined in the field set to the object's fields. If you need to add the same field set more than once, then you'll have to specify the `name` attribute on the added field set, and their included fields will be prefixed with that name.

For example, in the following `sales order` object, we include the `address` field set under both `bill to` and `ship to` names, which will effectively include its `address id` field as `bill to address id` and `ship to address id` on our object.

```xml
  <fieldsets>
<!-- highlight-next-line -->
    <fieldset name="address">
      <field name="address id" type="integer" required="true"/>
    </fieldset>
  </fieldsets>
  <objects>
    <object name="sales order">
      <fields>
        <field name="sales order id" type="sales order" key="serial" required="true"/>
        <field name="customer id" type="customer" required="true"/>
<!-- highlight-start -->
        <fieldset name="bill to" ref="address"/>
        <fieldset name="ship to" ref="address" required="false"/>
<!-- highlight-end -->
      </fields>
    </object>
```

Notice how we can set the `required="false"` attribute on the `ship to` the field set above, which will override the default `required` setting on all the fields of the field set.

If you need even more fine-grained control of the included fieldset fields, then you can add any included field to the added fieldset and override any settings, such as the `type`, `required` flag, or any of the field configs.

In the following example, we override the type of the included `modified date` field from the `audit fields` field set in order to use a `date time offset` type rather than just `date time`.

```xml
  <fieldsets>
    <fieldset name="audit fields">
<!-- highlight-next-line -->
      <field name="modified date" type="date time" required="true"/>
    </fieldset>
  </fieldsets>
  <objects>
    <object name="sales order">
      <fields>
        <fieldset ref="audit fields">
<!-- highlight-next-line -->
          <field name="modified date" type="date time offset"/>
        </fieldset>
      </fields>
    </object>
```

### Object configuration

Additional object configurations are defined in separate namespaces and listed under their standard `config` element.

You can add configuration of the associated database table under the `sql:table` element, which allows the following attributes.
- `name` - custom table name including any schemas, if not derived from the current object and module names.
- `mode` - object persistence mode. Set to `none` when the object has no associated table.

The following example illustrates this configuration.

```xml
<object name="email address">
  <fields>[...]
  <config>
<!-- highlight-next-line -->
    <sql:table name="Person.EmailAddress"/>
  </config>
</object>
```

Another configuration allows you to customize generated EF entities in a separate partial class by adding `edm:customize` element, as follows.

```xml
<object name="person">
  <fields>[...]
  <config>
    <sql:table name="Person.Person"/>
<!-- highlight-next-line -->
    <edm:customize extend="true"/>
  </config>
</object>
```


## Associations and foreign keys

Xomega domain model is structured in such a way that you don't need to explicitly specify associations between domain objects. Any associations are automatically inferred from the logical types or fieldsets that you use on your domain objects. Yet, you do have the ability to configure the details of the corresponding database foreign keys.

### Simple associations

As we discussed [above](#pk1), the logical type on a simple key field of a domain object cannot be used on a key field of any other domain object, which allows Xomega to uniquely identify an object by just the logical type and establish an implicit association to it from another object whenever you use that type, or its subtype, on one of its fields.

The following example illustrates how the key field `customer id` of the `customer` object uses a dedicated type, also named `customer`, while the `customer id` field of the `sales order` object below it also uses this type, thereby referencing the `customer` object.

```xml
<types>
  <type name="sales order" base="integer key"/>
<!-- highlight-next-line -->
  <type name="customer" base="integer key"/>
</types>
<objects>
  <object name="customer">
    <fields>
<!-- highlight-next-line -->
      <field name="customer id" type="customer" key="serial" required="true"/>
      <field name="account number" type="char string10" required="true"/>
    </fields>
  </object>
  <object name="sales order">
    <fields>
      <field name="sales order id" type="sales order" key="serial" required="true"/>
      <field name="order date" type="date time" required="true"/>
<!-- highlight-next-line -->
      <field name="customer id" type="customer" required="true"/>
    </fields>
  </object>
</objects>
```

:::note
If you define a subtype of the `customer` type, e.g., `internal customer`, and use that subtype on the `customer id` field, then Xomega will still define an association to the `customer` object unless, of course, that subtype is also used on a key field of another object.
:::

If you need to configure the properties of the underlying foreign key, you can do it in the `sql:foreign-key` config element of the field, as follows.

```xml
<object name="sales order">
  <fields>
    ...
<!-- highlight-next-line -->
    <field name="customer id" type="customer" required="true">
      <config>
<!-- highlight-next-line -->
        <sql:foreign-key name="FK_Custom" delete="cascade" update="no action"/>
      </config>
    </field>
  </fields>
</object>
```

The `sql:foreign-key` element allows you to specify the following attributes.
- `name` - custom foreign key name, if not derived from the names of the field and related objects.
- `mode` - set to `none` to suppress the foreign key constraint.
- `update` - specifies the "on update" action: `no action`, `cascade`, `set null`, or `set default`.
- `delete` - specifies the "on delete" action: `no action`, `cascade`, `set null`, or `set default`.

### Complex associations

Similar to simple associations, Xomega automatically establishes an implicit association to a domain object with a complex key whenever you use its key fieldset in another domain object. This is possible because field sets that are used as keys on one object cannot be used as a key on another object, as we discussed [above](#pk2).

The following example shows how the `special offer product` object has a composite key implemented by the corresponding fieldset with the same name, and the `detail` subobject of the `sales order` object uses that fieldset, thereby referencing the `special offer product` object.

```xml
<fieldsets>
<!-- highlight-next-line -->
  <fieldset name="special offer product">
    <field name="special offer id" type="special offer" required="true"/>
    <field name="product id" type="product" required="true"/>
  </fieldset>
</fieldsets>
<objects>
  <object name="special offer product">
    <fields>
<!-- highlight-next-line -->
      <fieldset ref="special offer product" key="supplied" required="true"/>
    </fields>
  </object>
  <object name="sales order">
    <fields>[...]
    <subobjects>
      <object name="detail">
        <fields>
          <field name="sales order detail id" type="sales order detail" key="serial" required="true"/>
          <field name="order qty" type="small int" required="true">
<!-- highlight-next-line -->
          <fieldset ref="special offer product"/>
        </fields>
      </object>
    </subobjects>
  </object>
</objects>
```

If you need to configure the properties of the underlying foreign key, you can do it in the `sql:composite-foreign-key` config element of the fieldset, as follows.

```xml
  <object name="detail">
    <fields>
      <field name="sales order detail id" type="sales order detail" key="serial" required="true"/>
      <field name="order qty" type="small int" required="true">
<!-- highlight-next-line -->
      <fieldset ref="special offer product">
        <config>
<!-- highlight-next-line -->
          <sql:composite-foreign-key name="FK_SpecOffer" delete="cascade" update="cascade"/>
        </config>
      </fieldset>
    </fields>
  </object>
```

The `sql:composite-foreign-key` element allows you to specify the following attributes.
- `name` - custom foreign key name, if not derived from the names of the fields and related objects.
- `mode` - set to `none` to suppress the foreign key constraint.
- `update` - specifies the "on update" action: `no action`, `cascade`, `set null`, or `set default`.
- `delete` - specifies the "on delete" action: `no action`, `cascade`, `set null`, or `set default`.

### Subtype associations

If a simple primary key of your domain object has an association with another object, then it's modeled in Xomega by using a subtype of the referenced object's key type as the key type of your object.

To illustrate this concept, let's consider that you have three domain objects: `business entity`, `person`, and `employee`, where each type of domain object defines a subset of the previous type of object, i.e., `employee` objects are a subset of `person` objects.

What you need to do is to define a logical type for each type of domain object and inherit them from each other, as follows.

```xml
<types>
  <type name="business entity" base="integer key"/>
  <type name="person" base="business entity"/>
  <type name="employee" base="person"/>
</types>
```

Now, when you use these types on the key fields of the corresponding domain objects, as illustrated below, you will establish implicit associations to the base type's object, i.e., the `employee` object will have a reference to the `person` object from its key, which will, in turn, have a reference to the `business entity` object from its key.

```xml
<objects>
  <object name="business entity">
    <fields>
<!-- highlight-next-line -->
      <field name="business entity id" type="business entity" key="serial" required="true"/>
      ...
    </fields>
  </object>
  <object name="person">
    <fields>
<!-- highlight-next-line -->
      <field name="business entity id" type="person" key="supplied" required="true"/>
      ...
    </fields>
  </object>
  <object name="employee">
    <fields>
<!-- highlight-next-line -->
      <field name="business entity id" type="employee" key="supplied" required="true"/>
      ...
    </fields>
  </object>
</objects>
```

If you also need to configure the foreign key attributes for any of these implicit associations, you can do that on the nested `sql:foreign-key` config element of the corresponding key field, just like you do with simple associations on non-key fields.

## Sub-objects and aggregates

Following the best practices of Domain Driven Design (DDD), Xomega allows you to define some domain objects as subobjects of the parent aggregate object. The top-level object is called an *aggregate root* in DDD.

Subobjects are defined under the `subobjects` element of its parent object and have the same structure as any other objects, including being able to have their own subobjects. Subobjects do have the following differences from aggregate roots.
- The subobject name must be unique only within its parent object, but its full unique name starts with the full name of its parent.
- The subobject's primary key automatically includes the primary key of its parent.
- The subobject has an implicit association with its parent object.

In the following example, the `sales order` object has a list of `line item` subobjects, which in turn includes a list of options for each line item defined by its subobject `option`.

```xml
<!-- highlight-next-line -->
<object name="sales order">
  <fields>
    <field name="sales order id" type="sales order" key="serial" required="true"/>
    <field name="customer id" type="customer" required="true"/>
  </fields>
  <subobjects>
<!-- highlight-next-line -->
    <object name="line item">
      <fields>
        <field name="product id" type="product" key="reference" required="true"/>
        <field name="quantity" type="integer" required="true"/>
        <field name="line total" type="money" required="true"/>
      </fields>
      <subobjects>
<!-- highlight-next-line -->
        <object name="option">
          <fields>
            <field name="option code" type="product option" key="supplied" required="true"/>
          </fields>
        </object>
      </subobjects>
    </object>
  </subobjects>
</object>
```

### Primary keys

If you take a look at the above example, you'll notice that the `line item` subobject has its field `product id` marked with the `key="reference"` attribute. This is assuming that its type `product` is used on the key of the `product` object, which is not shown here. Alternatively, if you define and use a subtype of the `product` type for the key field, e.g., `line item product`, then you will be able to use the `key="supplied"` attribute instead.

The generated `line item` entity will automatically include the primary key of its parent object `sales order`, i.e., the `sales order id` field, as part of its own primary key along with the `product id`. This makes defining subobjects more natural, as you don't need to worry about including the parent key fields in them.

If you look at the `option` subobject, you will see that it has a key field `option code` that is supplied by the user. However, the generated entity for that object will also include both `sales order id` and `product id`, which are the primary key of its parent object `line item`, and those fields will be part of the `option` entity's primary key.

Now imagine that we change the `line item` subobject to use an auto-generated key `line item id` instead of the supplied `product id`, and set the `key="serial"` attribute on it, as follows.

```xml
<object name="line item">
  <fields>
<!-- highlight-next-line -->
    <field name="line item id" type="sales order line item" key="serial" required="true"/>
    <field name="product id" type="product" required="true"/>
    <field name="quantity" type="integer" required="true"/>
    <field name="line total" type="money" required="true"/>
  </fields>
  <subobjects>
    <object name="option">
      <fields>
<!-- highlight-next-line -->
        <field name="option code" type="product option" key="supplied" required="true"/>
      </fields>
    </object>
  </subobjects>
</object>
```

In this case, the `line item id` will be considered unique in and of its own and will serve as the sole primary key for the `line item` entity. The parent object's primary key `sales order id` will still be implicitly included in the `line item` object, but it will not be part of its primary key.

Similarly, the `option` subobject will automatically include only the `line item id` key field from its parent, but not the `sales order id` field from its grandparent, since the former already uniquely identifies the `line item`. Both `line item id` and `option code` will serve as a primary key for the `option` object since the supplied key `option code` will be considered to be not globally unique.

### Parent associations

The presence of the `key` field(s) in subobjects indicates that the aggregate object can have a list of such subobjects, and Xomega will automatically define a one-to-many association between the parent object and the subobject.

If the subobject has no key fields, then it will be considered to allow no more than one such subobject, and the primary key of the subobject will be the same as the parent object's key. In other words, the subobject will have a zero-to-one association with its parent object.

:::tip
A subobject with no keys that has a zero-to-one association to its parent is useful if you want to define some extension fields for the parent object on the subobject, which you don't want to add directly to the parent object.
:::

If you need to configure specific properties of the implicit foreign key to the parent object, such as the name or update/delete actions, then you can do it in the `sql:parent-foreign-key` element nested under the `sql:table` config element, as follows.

```xml
<object name="line item">
  <fields>
    <field name="product id" type="product" key="reference" required="true"/>
    <field name="quantity" type="integer" required="true"/>
    <field name="line total" type="money" required="true"/>
  </fields>
  <config>
    <sql:table name="Sales.SalesOrderLineItem">
<!-- highlight-next-line -->
      <sql:parent-foreign-key name="FK_SalesOrderLineItem" delete="cascade" update="no action"/>
    </sql:table>
  </config>
  <subobjects>[...]
</object>
```

The `sql:parent-foreign-key` element allows you to specify the following attributes.
- `name` - custom foreign key name, if not derived from the names of the field and related objects.
- `mode` - set to `none` to suppress the foreign key constraint.
- `update` - specifies the "on update" action: `no action`, `cascade`, `set null`, or `set default`.
- `delete` - specifies the "on delete" action: `no action`, `cascade`, `set null`, or `set default`.

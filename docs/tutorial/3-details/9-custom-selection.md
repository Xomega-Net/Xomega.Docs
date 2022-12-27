---
sidebar_position: 10
---

# 3.9 Custom contextual selection

In this section, you will learn how to implement custom selection from a list that depends on the current values on the screen, rather than always having the same options. You will also see how to further display the values of additional related attributes when selecting an option from a list.

## Overview of updates

If we take another look at the *Customer* tab, we will notice that we still have the *Bill To* and *Ship To* address fields displayed as editable internal IDs that point to some stored `Address` entities in the normalized `AdventureWorks` database, as shown below.

![Address IDs](img9/address-ids.png)

This is clearly not how we want the users to enter these values. Normally, we would want the user to select the stored address from a list of addresses for the current customer, which is defined in the `BusinessEntityAddress` association table.

However, there are tens of thousands of records in that table, and we don't want to load them all into a cache as we did with dynamic enumerations previously. It would also not be too user-friendly to make the user select the address from a separate look-up form, as we did for the customer selection.

What we want is a contextual dropdown list, which would use the currently selected customer to read the list of associated addresses. To implement the population of such a contextual list, we can leverage many of the existing Xomega features, but we will need to write some custom code to glue it all together, as you'll see below.

## Defining contextual enumeration

When we imported our model from the database, the `BusinessEntityAddress` association table was imported as a separate standalone object in the `business_entity_address.xom` file, rather than as a subobject of the aggregate `business entity` object.

:::note
The reason for this is because the import process uses a presence of **cascade delete** on the foreign key constraint to the parent table, in order to determine whether or not an entity should be a subobject of another entity, and those tables did not have cascade delete set up for them.
:::

To define our contextual enumeration we will first make the `business entity address` a subobject of the `business entity` aggregate object, and then will add a standard `read enum` operation to that subobject.

### Business Entity Address subobject

Making the imported `business entity address` a subobject of the `business entity` object is extremely simple in the model.

We'll just add a `subobjects` element to the `business entity` object, move the object definition of the `business entity address` from the `business_entity_address.xom` file over to that element, and rename it to just `address` since it's already qualified with its parent object's name.

We will also move the fieldset `business entity address` from `business_entity_address.xom` to the `business_entity.xom`, and remove the `business entity id` field from it, since the key field of the parent is automatically implicitly included in the subobjects. The updated file `business_entity.xom` will look as follows.

```xml title="business_entity.xom"
<!-- added-lines-start -->
  <fieldsets>
    <fieldset name="business entity address">
<!-- added-lines-end -->
<!-- removed-next-line -->
      <field name="business entity id" type="business entity" required="true">[...]
<!-- added-lines-start -->
      <field name="address id" type="address" required="true">[...]
      <field name="address type id" type="address type" required="true">[...]
    </fieldset>
  </fieldsets>
<!-- added-lines-end -->
  <objects>
    <object name="business entity">
      <fields>
<!-- highlight-next-line -->
        <field name="business entity id" type="business entity" key="serial" required="true">
        ...
      </fields>
      <config>[...]
      <doc>[...]
<!-- added-lines-start -->
      <subobjects>
<!-- highlight-next-line -->
        <object name="address">
          <fields>
            <fieldset ref="business entity address" key="supplied" required="true"/>
            <field name="rowguid" type="guid" required="true">[...]
            <field name="modified date" type="date time" required="true">[...]
          </fields>
          <config>
            <sql:table name="Person.BusinessEntityAddress">
<!-- highlight-next-line -->
              <sql:parent-foreign-key delete="no action"/>
            </sql:table>
          </config>
          <doc>[...]
        </object>
      </subobjects>
<!-- added-lines-end -->
    </object>
  </objects>
```
:::note
If we want to keep the `delete` action for the parent foreign key, instead of using the default *cascade* action, then we'll need to set it on the `sql:parent-foreign-key` element.
:::

:::tip
At this point we can go ahead and delete the `business_entity_address.xom` file, since there will be nothing left in it.
:::

### Adding Read Enum on a subobject

Now we need to add a `read enum` operation to our `address` subobject of the `business entity` object. Since we want to generate it only on the subobject, and not on the parent object, we can open properties of the *Read Enum Operation* generator, and set the *Generate Read Enum* parameter to `False`, while keeping the *Generate Subobject Read Enum* parameter set to `True`, as follows.

![Generate Subobject Read Enum](img9/read-enum-gen.png)

After that, let's right-click on the `business_entity.xom` file, and run the *Read Enum Operation* generator. Instead of the default output parameters, we will use `address id` and `address type` as the ID and description parameters for our enumeration, and will also add some standard address fields defined on the `address` aggregate object as additional output parameters, as shown below.

```xml title="business_entity.xom"
<object name="address">
    ...
    <operation name="read enum">
      <input>
        <param name="business entity id" type="business entity" required="true"/>
      </input>
      <output list="true">
<!-- removed-lines-start -->
        <param name="id" type="string"/>
        <param name="description" type="string"/>
        <param name="rowguid"/>
        <param name="modified date"/>
<!-- removed-lines-end -->
<!-- added-lines-start -->
        <param name="address id" type="address" required="true"/>
        <param name="address type" type="string50" required="true"/>
        <param name="address line1" type="string60"/>
        <param name="address line2" type="string60"/>
        <param name="city" type="string30"/>
        <param name="state" type="code3"/>
        <param name="postal code" type="string15"/>
        <param name="country" type="country region"/>
<!-- added-lines-end -->
      </output>
      <config>
        <rest:method verb="GET" uri-template="business-entity/{business entity id}/address/enum"/>
<!-- removed-next-line -->
        <xfk:enum-cache enum-name="business entity address" id-param="id" desc-param="description"/>
<!-- added-next-line -->
        <xfk:enum-cache enum-name="business entity address" id-param="address id" desc-param="address type"/>
      </config>
    </operation>
    ...
</object>
```

:::note
Since the output parameters do not match the object's fields, we had to set the `type` attributes, which we set using the type on the corresponding object fields from the `address` aggregate object.
:::


### Refactoring logical types

Technically, input and output parameters here should use the same logical types, as the types for the corresponding fields on the related objects. But to add more clarity to the model, you will want to rename the default types that were generated by the import process and give them more meaningful names.

You can do it right here, where you use these types, by selecting *Rename* from the context menu, or by pressing *Ctrl+R,R*. This will bring up the *Rename* dialog and will display all references of the selected type that will be renamed.

For example, if you open *Rename* dialog for the `string60` type, you will see that it is used only by the `address line` fields, so we'll go ahead and rename it to a more appropriate `address line` type, as follows.

![Address line type](img9/type-address-line.png)

Similarly, we'll rename `string30` to the `city name`, and `code3` to the `state province code`, since they are used only by the corresponding fields.

If you try to rename the generated `string50` type, you'll notice that it is mostly used by fields that represent some sort of name. So you can go ahead and rename it to the `name` type for now, and then separately refactor a few fields where this type may be less appropriate.

![Name type](img9/type-name.png)

A generated type may be also used by various types of fields, such as the case with the `string15` that is used on the `postal code`, but also some other fields such as `account number`. In this case, you can just create a new type of `postal code` with the same setup, and manually update the `postal code` field of the `address` object to use the new type, without touching the other fields.

Normally, you'll want to move the new specific types to the same files where they are being used the most. In our case, we will move the renamed address-related types from `_types.xom` to the `address.xom` file, which will look like this.

```xml title="address.xom"
  <types>
<!-- removed-next-line -->
    <type name="address" base="integer key"/>
<!-- added-lines-start -->
    <type name="address" base="integer enumeration"/>
    <type name="address line" base="string" size="60"/>
    <type name="city name" base="string" size="30"/>
    <type name="postal code" base="string" size="15"/>
    <type name="state province code" base="code" size="3"/>
<!-- added-lines-end -->
  </types>
```

Notice that we also changed the base type for the `address` type from `integer key` to `integer enumeration`, so that it would use enumeration-related properties and controls.

Here is what our parameters will look like after the refactoring.

```xml title="business_entity.xom"
    <object name="address">
      ...
        <operation name="read enum">
          <input>[...]
          <output list="true">
<!-- highlight-start -->
            <param name="address id" type="address" required="true"/>
            <param name="address type" type="name" required="true"/>
            <param name="address line1" type="address line"/>
            <param name="address line2" type="address line"/>
            <param name="city" type="city name"/>
            <param name="state" type="state province code"/>
            <param name="postal code" type="postal code"/>
            <param name="country" type="country region"/>
<!-- highlight-end -->
          </output>
          <config>[...]
        </operation>
      ...
    </object>
```

### Custom service implementation

To provide custom service implementation for all our output parameters, let's build the model project to regenerate the services. Once they are regenerated, we will provide the following implementation in the `Address_ReadEnumAsync` method of our new `BusinessEntityService` to populate the output fields from the related objects.

```cs title="BusinessEntityAddressService.cs"
public partial class BusinessEntityService : BaseService, IBusinessEntityService
{
    public virtual async Task<Output<ICollection<BusinessEntityAddress_ReadEnumOutput>>>
        Address_ReadEnumAsync(int _businessEntityId, CancellationToken token = default)
    {
        ...
        var qry = from obj in src
        select new BusinessEntityAddress_ReadEnumOutput() {
            AddressId = obj.AddressId,
            // CUSTOM_CODE_START: set the AddressType output parameter of Address_ReadEnum operation below
/* removed-next-line */
            // TODO: AddressType = obj.???, // CUSTOM_CODE_END
/* added-next-line */
            AddressType = obj.AddressTypeObject.Name, // CUSTOM_CODE_END
            // CUSTOM_CODE_START: set the AddressLine1 output parameter of Address_ReadEnum operation below
/* removed-next-line */
            // TODO: AddressLine1 = obj.???, // CUSTOM_CODE_END
/* added-next-line */
            AddressLine1 = obj.AddressObject.AddressLine1, // CUSTOM_CODE_END
            // CUSTOM_CODE_START: set the AddressLine2 output parameter of Address_ReadEnum operation below
/* removed-next-line */
            // TODO: AddressLine2 = obj.???, // CUSTOM_CODE_END
/* added-next-line */
            AddressLine2 = obj.AddressObject.AddressLine2, // CUSTOM_CODE_END
            // CUSTOM_CODE_START: set the City output parameter of Address_ReadEnum operation below
/* removed-next-line */
            // TODO: City = obj.???, // CUSTOM_CODE_END
/* added-next-line */
            City = obj.AddressObject.City, // CUSTOM_CODE_END
            // CUSTOM_CODE_START: set the State output parameter of Address_ReadEnum operation below
/* removed-next-line */
            // TODO: State = obj.???, // CUSTOM_CODE_END
/* added-next-line */
            State = obj.AddressObject.StateProvinceObject.StateProvinceCode, // CUSTOM_CODE_END
            // CUSTOM_CODE_START: set the PostalCode output parameter of Address_ReadEnum operation below
/* removed-next-line */
            // TODO: PostalCode = obj.???, // CUSTOM_CODE_END
/* added-next-line */
            PostalCode = obj.AddressObject.PostalCode, // CUSTOM_CODE_END
            // CUSTOM_CODE_START: set the Country output parameter of Address_ReadEnum operation below
/* removed-next-line */
            // TODO: Country = obj.???, // CUSTOM_CODE_END
/* added-next-line */
            Country = obj.AddressObject.StateProvinceObject.CountryRegionCode, // CUSTOM_CODE_END
        };
        ...
    }
}
```

To make sure that your inline customizations are [preserved if you run the *Clean* command](../search/custom-result#caution-on-mixed-in-customizations) on the model, you can add an `svc:customize` config element to the `business entity` object, and set the `preserve-on-clean="true"` attribute, as follows.

```xml title="business_entity.xom"
    <config>
      <sql:table name="Person.BusinessEntity"/>
<!-- added-next-line -->
      <svc:customize preserve-on-clean="true"/>
    </config>
```

## Contextual UI selection

For the contextual address selection we need to add custom code in the customized `SalesOrderCustomerObject`, so let's set the `customize="true"` attribute in the model, and build the model project to generate a customization subclass.

```xml title="sales_order.xom"
    <xfk:data-object class="SalesOrderCustomerObject" customize="true">[...]
```

Now, let's open the generated `SalesOrderCustomerObjectCustomized.cs` file in the `AdventureWorks.Client.Common` project, and implement custom logic for the *Bill-To* and *Ship-To* addresses.

### Local lookup cache loaders

Since both of these fields use the same list of addresses based on the currently selected customer, we are going to declare a local lookup cache loader that we'll call `AddressLoader`, and instantiate it in the `OnInitialized` method using the `BusinessEntityAddressReadEnumCacheLoader` class that was generated for us from the `read enum` operation that we defined. Then we'll set it as the `LocalCacheLoader` on both properties, as follows.

```cs title="SalesOrderCustomerObjectCustomized.cs"
/* added-lines-start */
using AdventureWorks.Services.Common;
using Xomega.Framework.Lookup;
/* added-lines-end */

public class SalesOrderCustomerObjectCustomized : SalesOrderCustomerObject
{
/* added-next-line */
    private LocalLookupCacheLoader AddressLoader;
    ...
    // perform post initialization
    protected override void OnInitialized()
    {
        base.OnInitialized();

/* added-lines-start */
        AddressLoader = new BusinessEntityAddressReadEnumCacheLoader(ServiceProvider);
        BillToAddressIdProperty.LocalCacheLoader = AddressLoader;
        ShipToAddressIdProperty.LocalCacheLoader = AddressLoader;
/* added-lines-end */
    }
}
```

### Handling property changes

To read a list of addresses for the current customer we will use either the `store id` or the `person id` of the current customer as the `business entity id` parameter for the operation.

Therefore, we need to add an async listener `OnCustomerChanged` to both of these properties and update the list of addresses in the `AddressLoader` when the value of either of them changes. This is done by calling the `SetParametersAsync` method on our local cache loader and passing a dictionary of named input parameters and their **transport** values, as shown below.

```cs title="SalesOrderCustomerObjectCustomized.cs"
using AdventureWorks.Services.Common;
/* added-next-line */
using AdventureWorks.Services.Common.Enumerations;
...

public class SalesOrderCustomerObjectCustomized : SalesOrderCustomerObject
{
    ...
    // perform post initialization
    protected override void OnInitialized()
    {
        ...
/* added-lines-start */
        StoreIdProperty.AsyncChange += OnCustomerChanged;
        PersonIdProperty.AsyncChange += OnCustomerChanged;
/* added-lines-end */
    }

/* added-lines-start */
    private async Task OnCustomerChanged(object sender, PropertyChangeEventArgs e, CancellationToken token)
    {
        if (!e.Change.IncludesValue() || Equals(e.OldValue, e.NewValue) ||
            PersonIdProperty.Value == null && StoreIdProperty.Value == null) return;

        var entityId = StoreIdProperty.IsNull() ? // use store or person id
            PersonIdProperty.TransportValue : StoreIdProperty.TransportValue;

// highlight-start
        await AddressLoader.SetParametersAsync(new Dictionary<string, object>() {
            { BusinessEntityAddress.Parameters.BusinessEntityId, entityId }
        }, AddressLoader.LocalCache, token);
// highlight-end

        await BillToAddressIdProperty.ClearInvalidValues();
        await ShipToAddressIdProperty.ClearInvalidValues();

        var args = new PropertyChangeEventArgs(PropertyChange.Items, null, null, e.Row);
        await BillToAddressIdProperty.FirePropertyChangeAsync(args, token);
        await ShipToAddressIdProperty.FirePropertyChangeAsync(args, token);
    }
/* added-lines-end */
}
```

:::note
To avoid hardcoding input parameters' names we used the `BusinessEntityAddress.Parameters.BusinessEntityId` constant that was also generated for us in the `Enumerations` class.
:::

Once the local cache is loaded with new values, we want to clear the current values of the *Bill-To* and *Ship-To* properties, if they are no longer valid, and then make those properties notify their listeners about the change of their list of items.

:::tip
We had to write all this custom code because the input parameter is sourced from two properties - `store id` or `person id`, and because we used the same cache loader to populate a list of addresses for both *Bill-To* and *Ship-To* properties.

For a more standard case, where a list for a single property depends on the value of another property, Xomega Framework provides a much easier method, as you'll see in the [next section](context-selection).
:::

## Reviewing contextual selection

If we run our application now, we'll see that the address properties display dropdowns with different types of addresses for the current customer, which get blanked out and their lists updated whenever you change the customer. The following picture shows what it looks like now.

![Address list](img9/address-ids-list.png)

This setup is much more usable now since you can select one of the stored addresses for the current customer instead of entering their internal ID.

What is missing though, is the ability to view the details of the selected address beyond the address type, such as the street address, city, state, etc. All this information is already returned from the service and stored as attributes of the selected value, so we just need to show them on the screen as separate fields.

## Grouping selection attributes

It makes sense to group the address fields for each type of address in its own child panel. To configure that in the model we will use the techniques that we have learned earlier.

### Defining grouping data object

First off, let's declare a data object `AddressObject` in the `address.xom` file, and then define two structures contributing their parameters to this data object - one for updates with just the `address key`, and another with the full `address info`, as shown below.

```xml title="address.xom"
<!-- added-lines-start -->
  <structs>
<!-- highlight-next-line -->
    <struct name="address key" object="address">
      <param name="address id"/>
      <config>
<!-- highlight-next-line -->
        <xfk:add-to-object class="AddressObject"/>
      </config>
      <doc>
        <summary>Address key information</summary>
      </doc>
    </struct>
<!-- highlight-next-line -->
    <struct name="address info" object="address">
      <param name="address line1"/>
      <param name="address line2"/>
      <param name="city state" type="string"/>
      <param name="postal code"/>
      <param name="country" type="country region"/>
      <config>
<!-- highlight-next-line -->
        <xfk:add-to-object class="AddressObject"/>
      </config>
<!-- highlight-next-line -->
      <usage generic="true"/>
      <doc>
        <summary>Full address information</summary>
      </doc>
    </struct>
  </structs>
<!-- added-lines-end -->
  ...
<!-- added-lines-start -->
  <xfk:data-objects>
    <xfk:data-object class="AddressObject"/>
  </xfk:data-objects>
<!-- added-lines-end -->
```

The purpose of the `address info` structure is to add more fields to the `AddressObject`, and we're not going to use it in any operations. Therefore, to suppress a warning that this structure is not being used, we have marked it with `generic="true"`.

### Configuring address fields

For the same reason, since the system cannot determine if its fields are editable based on whether or not this structure appears in the input of any of the operations, we will need to explicitly mark all those parameters in the `AddressObject` with `editable="false"` to generate data labels instead of edit controls for these fields, as shown below.

```xml title="address.xom"
    <xfk:data-object class="AddressObject">
<!-- added-lines-start -->
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
<!-- added-lines-end -->
```

While we were at it, we also set proper labels on some fields and configured their layout in the panel in the `ui:fields` element. Specifically, we set `field-cols="3"` to lay out the fields in no more than 3 columns, and also set the `field-width` to be 100px, which will be used by the framework to determine how many columns to use for the current view size.

### Updating operation structures

Next, we will replace the `bill to address id` and `ship to address id` parameters with references to our new `address key` structure in the `customer info` and `customer update` structures, as follows.

```xml title="sales_order.xom"
<!-- highlight-next-line -->
    <struct name="customer info" object="customer">
      ...
<!-- removed-lines-start -->
      <param name="bill to address id" type="address"/>
      <param name="ship to address id" type="address"/>
<!-- removed-lines-end -->
<!-- added-lines-start -->
      <struct name="billing address" ref="address key"/>
      <struct name="shipping address" ref="address key"/>
<!-- added-lines-end -->
      <config>[...]
    </struct>
<!-- highlight-next-line -->
    <struct name="customer update" object="customer">
      <param name="customer id"/>
<!-- removed-lines-start -->
      <param name="bill to address id" type="address"/>
      <param name="ship to address id" type="address"/>
<!-- removed-lines-end -->
<!-- added-lines-start -->
      <struct name="billing address" ref="address key"/>
      <struct name="shipping address" ref="address key"/>
<!-- added-lines-end -->
      <config>[...]
    </struct>
```

We used the `billing address` and `shipping address` as the names for the new structure, and now need to add `AddressObject` as a child of the `SalesOrderCustomerObject` for both the billing and shipping addresses using the same names, as shown below.

```xml
    <xfk:data-object class="SalesOrderCustomerObject" customize="true">
      <xfk:add-child name="lookup" class="SalesCustomerLookupObject"/>
<!-- added-lines-start -->
      <xfk:add-child name="billing address" class="AddressObject"/>
      <xfk:add-child name="shipping address" class="AddressObject"/>
<!-- added-lines-end -->
      <ui:display>[...]
    </xfk:data-object>
```

### Configuring Customer panel layout

While we are editing the `SalesOrderCustomerObject` data object, let's configure it to better lay out its own customer fields, as well as its child panels, which are placed under the *Customer* tab along with the main fields.

First, we will configure the main panel with the customer's fields that are represented by the `ui:fields` element. To identify this panel on the screen among other child panels, we'll set its `title="Customer Info"` attribute. We will also lay out the fields in the main panel in two columns by setting the `field-cols="2"` attribute.

Next, we will set the title for the `lookup` panel to be "Lookup Customer" in the corresponding `ui:child-panels/ui:panel` element, and will also use a 2-column layout for the lookup panel by setting `field-cols="2"` there.

Finally, we will lay out the main panel and all the child panels in 2 columns within their parent *Customer* tab by setting `panel-cols="2"` on the `ui:fields` and `ui:panel` elements.

The following snippet illustrates this setup.

```xml
    <xfk:data-object class="SalesOrderCustomerObject" customize="true">
      <xfk:add-child name="lookup" class="SalesCustomerLookupObject"/>
      <xfk:add-child name="billing address" class="AddressObject"/>
      <xfk:add-child name="shipping address" class="AddressObject"/>
      <ui:display>
<!-- removed-next-line -->
        <ui:fields>
<!-- added-next-line -->
        <ui:fields field-cols="2" panel-cols="2" title="Customer Info">
          <ui:field param="customer id" hidden="true"/>
          <ui:field param="person id" hidden="true"/>
          <ui:field param="store id" hidden="true"/>
          <ui:field param="territory id" label="Territory"/>
        </ui:fields>
<!-- added-lines-start -->
        <ui:child-panels>
          <ui:panel child="lookup" panel-cols="2" field-cols="2" title="Lookup Customer"/>
          <ui:panel child="billing address" panel-cols="2"/>
          <ui:panel child="shipping address" panel-cols="2"/>
        </ui:child-panels>
<!-- added-lines-end -->
      </ui:display>
    </xfk:data-object>
```

:::note
You can also lay out some or all child panels as tabs using `ui:tabs/ui:tab` element, but given that the *Customer* panel is already in a tab, it makes sense to keep them all displayed at once as panels.
:::

### Refactoring custom service code

Now that we have made all the model updates, let's build the model project, and refactor our custom implementations in the `SalesOrderServiceExtended.cs` file to use the new `AddressKey` structure, as follows.

```cs title="SalesOrderServiceExtended.cs"
protected CustomerInfo GetCustomerInfo(SalesOrder obj) => new CustomerInfo()
{
    ...
/* removed-lines-start */
    BillToAddressId = obj.BillToAddressId,
    ShipToAddressId = obj.ShipToAddressId,
/* removed-lines-end */
/* added-lines-start */
    BillingAddress = new AddressKey { AddressId = obj.BillToAddressId },
    ShippingAddress = new AddressKey { AddressId = obj.ShipToAddressId },
/* added-lines-end */
};

protected async Task UpdateCustomer(SalesOrder obj, CustomerUpdate _data)
{
    ...
/* removed-lines-start */
    obj.BillToAddressObject = await ctx.FindEntityAsync<Address>(currentErrors, _data.BillToAddressId);
    obj.ShipToAddressObject = await ctx.FindEntityAsync<Address>(currentErrors, _data.ShipToAddressId);
/* removed-lines-end */
/* added-lines-start */
    obj.BillToAddressObject = await ctx.FindEntityAsync<Address>(currentErrors, _data.BillingAddress.AddressId);
    obj.ShipToAddressObject = await ctx.FindEntityAsync<Address>(currentErrors, _data.ShippingAddress.AddressId);
/* added-lines-end */
}
```

### Refactoring custom client code

We also need to update our `SalesOrderCustomerObjectCustomized.cs` to take the `AddressIdProperty` from the corresponding child object as follows.

```cs title="SalesOrderCustomerObjectCustomized.cs"

public class SalesOrderCustomerObjectCustomized : SalesOrderCustomerObject
{
    ...
    // perform post initialization
    protected override void OnInitialized()
    {
        ...
/* removed-lines-start */
        BillToAddressIdProperty.LocalCacheLoader = AddressLoader;
        ShipToAddressIdProperty.LocalCacheLoader = AddressLoader;
/* removed-lines-end */
/* added-lines-start */
        BillingAddressObject.AddressIdProperty.LocalCacheLoader = AddressLoader;
        ShippingAddressObject.AddressIdProperty.LocalCacheLoader = AddressLoader;
/* added-lines-end */
        ...
    }

    private async Task OnCustomerChanged(object sender, PropertyChangeEventArgs e, CancellationToken token)
    {
        ...
/* removed-lines-start */
        await BillToAddressIdProperty.ClearInvalidValues();
        await ShipToAddressIdProperty.ClearInvalidValues();
/* removed-lines-end */
/* added-lines-start */
        await BillingAddressObject.AddressIdProperty.ClearInvalidValues();
        await ShippingAddressObject.AddressIdProperty.ClearInvalidValues();
/* added-lines-end */

        var args = new PropertyChangeEventArgs(PropertyChange.Items, null, null, e.Row);
/* removed-lines-start */
        await BillToAddressIdProperty.FirePropertyChangeAsync(args, token);
        await ShipToAddressIdProperty.FirePropertyChangeAsync(args, token);
/* removed-lines-end */
/* added-lines-start */
        await BillingAddressObject.AddressIdProperty.FirePropertyChangeAsync(args, token);
        await ShippingAddressObject.AddressIdProperty.FirePropertyChangeAsync(args, token);
/* added-lines-end */
    }
}
```

## Populating address from a selection

So far we've just pushed the billing and shipping address IDs to separate panels, and added extra address fields to those panels.

Now we need to populate all those fields from the attributes of the selected address. We'll implement this in the customized  `AddressObject`, so let's add the  `customize="true"` to this data object, as follows.

```xml title="address.xom"
    <xfk:data-object class="AddressObject" customize="true">[...]
```

After we build the model, let's open the `AddressObjectCustomized.cs` file, and subscribe to the `Change` event for the `AddressIdProperty` to populate other address properties from the corresponding attributes of the selected `AddressId` value, as follows.

```cs title="AddressObjectCustomized.cs"
/* added-next-line */
using AdventureWorks.Services.Common.Enumerations;
...
public class AddressObjectCustomized : AddressObject
{
    ...
    protected override void OnInitialized()
    {
        base.OnInitialized();
/* added-next-line */
        AddressIdProperty.Change += OnAddressChanged;
    }

/* added-lines-start */
    private void OnAddressChanged(object sender, PropertyChangeEventArgs e)
    {
        if (!e.Change.IncludesValue() || Equals(e.OldValue, e.NewValue)) return;

        Header addr = AddressIdProperty.Value;
        AddressLine1Property.SetValue(addr?[BusinessEntityAddress.Attributes.AddressLine1]);
        AddressLine2Property.SetValue(addr?[BusinessEntityAddress.Attributes.AddressLine2]);
        CityStateProperty.SetValue(addr == null ? null : addr[BusinessEntityAddress.Attributes.City]
                                                + ", " + addr[BusinessEntityAddress.Attributes.State]);
        PostalCodeProperty.SetValue(addr?[BusinessEntityAddress.Attributes.PostalCode]);
        CountryProperty.SetValue(addr?[BusinessEntityAddress.Attributes.Country]);
    }
/* added-lines-end */
}
```

Here we can read all address attributes that we return in our contextual enumeration, and populate the extra read-only properties that we added to the data object. Notice how we use the generated constants to access enumeration attributes.

## Reviewing address grouping
Let's run the application now, and check out the *Customer* panel on the *Sales Order* details view. The picture below shows what it will look like.

![Address panels](img9/address-panels.png)

As you see, we have turned it into a fully-fledged customer panel, where you can look up the customer, and select one of the customer addresses as the billing and shipping address, which will display read-only details of each address.

You can also see that the *Customer* panel uses our custom layout, where all panels have proper titles and are arranged in two columns. Both the main panel *Customer Info* and the child panel *Lookup Customer* have their fields arranged in two columns, while *Billing Address* and *Shipping Address* child panels lay out their fields in three columns.

We had to write some custom code to handle contextual selection here since the *Customer* tab is a little non-standard, where the input parameter for the list of addresses is sourced from one of two fields - store ID or person ID, and the same list of addresses is used on two fields - bill-to and ship-to address IDs. In a more standard case, when the value for each parameter comes from a single property, Xomega Framework minimizes the custom code you need to write, as you will see in the following section.

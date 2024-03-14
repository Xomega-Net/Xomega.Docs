---
sidebar_position: 7
---

# 2.6 Dynamic enumerations

In the previous section, we have seen how to define static enumerations in the model, which have a fixed list of values that don't change within any specific version of the application. In addition to static enumerations, applications also typically have dynamic enumerations based on some reference data.

The lists of values for dynamic enumerations are often small enough to allow selecting values from a dropdown list or a list box. The lists may change over time, but this generally happens rather infrequently, which warrants caching them in the application.

## Sales territory enumeration

In our project, a list of sales territories is a good example of such a dynamic enumeration. Instead of showing or entering the internal numeric territory ID on the sales order screens, we would like to show or select the territory name that is defined on the `sales territory` object.

In a nutshell, defining dynamic enumerations in the model is similar to defining static ones, except that instead of explicitly providing a list of values in the model, you need to configure a `read enum` operation with an `xfk:enum-cache` element, where you can give enumeration a name, and indicate which output parameter returns the ID, and which parameter returns the description for each enumeration element.

### Generating Read Enum operation

Xomega makes it quite easy by providing a special *Read Enum Operation* generator under the *Model Enhancement* group. Let's go ahead and right-click on the `sales_territory.xom` file and run this generator on the `sales territory` object, as shown below.

![Generate territory enum](img6/gen-territory-enum.png)

Once you have run the generator, you will see that it added a `read enum` operation to the object, and decorated it with the `xfk:enum-cache` specification.

Since the result of the operation will be cached, we'll want to remove any extraneous parameters to minimize the amount of data in the cache. We will leave only the *ID* and *description* (`name`) parameters, and a couple of other important attributes such as the territory `group`, which will allow us to do cascading selection later on, as illustrated below.

```xml title="sales_territory.xom"
<object name="sales territory">
  ...
  <operations>
<!-- highlight-next-line -->
    <operation name="read enum">
      <output list="true">
<!-- highlight-start -->
        <param name="territory id"/>
        <param name="name"/>
<!-- highlight-end -->
        <param name="country region code"/>
        <param name="group"/>
<!-- removed-lines-start -->
        <param name="sales ytd"/>
        <param name="sales last year"/>
        <param name="cost ytd"/>
        <param name="cost last year"/>
        <param name="rowguid"/>
        <param name="modified date"/>
<!-- removed-lines-end -->
      </output>
      <config>
        <rest:method verb="GET" uri-template="sales-territory/enum"/>
<!-- highlight-next-line -->
        <xfk:enum-cache enum-name="sales territory" id-param="territory id" desc-param="name"/>
      </config>
    </operation>
  </operations>
</object>
```

### Configuring key type

You'll notice that the generator also changed the `sales territory` key type to inherit from the `integer enumeration` type, and added to it a reference to the new enumeration.

Since instead of territory IDs we'll want to display the name, let's also update this type to set the `typical-length` of the data to 10 for a better calculation of column widths, as follows.

```xml
  <types>
    <type name="sales territory" base="integer enumeration">
      <config>
        <!-- highlight-next-line -->
        <ui:display-config typical-length="10"/>
      </config>
      <!-- highlight-next-line -->
      <enum ref="sales territory"/>
    </type>
  </types>
```

## Sales person enumeration

Now that we understand the structure of the model for dynamic enumerations, let's set it up for another object `sales person`, which will have a couple of additional twists to it.

The problem is that the key type `sales person` inherits from another key type `employee` for the employee object, which tells the model that a salesperson is a type of employee, and establishes an implicit zero-to-one relationship between the two objects.

```xml title="sales_person.xom"
  <types>
    <type name="sales person" base="employee"/>
  </types>
```

Therefore, we don't want to change the base type for the `sales person` type, and inherit it from `integer enumeration`, since we don't want to break this relationship.

### Generating Read Enum operation

We can configure the *Read Enum Operation* generator to leave the key types alone by setting its `Make Key Type Enumerated` property to `False`, as shown below.

![Generator key type](img6/gen-key-type.png)

:::note
You'll need to set it back to `True` after running the generator if you're not planning to keep it this way.
:::

Let's again right-click on the `sales_person.xom` file and run the *Read Enum Operation* generator.

As before, this will add a `read enum` operation to the `sales person` object, decorated with the enumeration specification. We will strip it off of any extraneous parameters, except for the key, description, and `territory id`, which we can use for cascading selection. We'll also add an output parameter `is-current` and will tie it to the enumeration's `is-active-param` attribute, as follows.


```xml
<object name="sales person">
  <operations>
    <operation name="read enum">
      <output list="true">
        <param name="business entity id"/>
        <param name="description" type="string"/>
<!-- added-next-line -->
        <param name="is-current" type="boolean" required="true"/>
        <param name="territory id"/>
<!-- removed-lines-start -->
        <param name="sales quota"/>
        <param name="bonus"/>
        <param name="commission pct"/>
        <param name="sales ytd"/>
        <param name="sales last year"/>
        <param name="rowguid"/>
        <param name="modified date"/>
<!-- removed-lines-end -->
      </output>
      <config>
        <rest:method verb="GET" uri-template="sales-person/enum"/>
        <xfk:enum-cache enum-name="sales person" id-param="business entity id" desc-param="description"
<!-- added-next-line -->
                        is-active-param="is-current"/>
      </config>
    </operation>
  </operations>
</object>
```

:::note
Since the `sales person` object does not have any suitable fields for the display name of its own, the generator added a `description` output parameter to the operation and set it as the description parameter `desc-param` for our enumeration.
:::

The `is current` output parameter that we added and set as the enumeration's `is-active-param` attribute indicates whether or not this is a currently employed salesperson. This will allow displaying only active/current salespersons in any selection lists, while still using any inactive items to decode the salesperson ID to their name/description.

### Configuring key type for enumeration

Because the key type was not updated to inherit from the `integer enumeration` type, for the reasons that we discussed earlier, we will need to add any relevant configurations from the `integer enumeration` type and its base type `selection` to the `sales person` type. Specifically, we need to add the Xomega Framework property type, and single-value and multi-value Blazor edit controls, as follows. 

```xml title="sales_person.xom"
  <types>
    <type name="sales person" base="employee">
      <config>
        <!-- highlight-next-line -->
        <xfk:property class="EnumIntProperty" namespace="Xomega.Framework.Properties" tsModule="xomega"/>
        <!-- highlight-next-line -->
        <ui:display-config typical-length="20"/>
        <ui:blazor-control>
          <!-- highlight-next-line -->
          <XSelect />
        </ui:blazor-control>
        <ui:blazor-control multi-value="true">
          <!-- highlight-next-line -->
          <XSelect />
        </ui:blazor-control>
      </config>
      <!-- highlight-next-line -->
      <enum ref="sales person"/>
    </type>
  </types>
```

:::note
When using other UI technologies, such as WPF, WebForms, or HTML, you'll need to configure the appropriate controls here for those technologies.
:::

And, of course, we added a reference to our dynamic enumeration to the type, to make it enumerated, and also set the `typical-length` to 20 for a better calculation of the column width.

### Implementing custom attributes

To add a custom implementation for our `description` and `is-current` parameters, we will build the model first and then will update the `ReadEnumAsync` service method on the generated `SalesPersonService` class as follows.

```cs title="SalesPersonService.cs"
public virtual async Task<Output<ICollection<SalesPerson_ReadEnumOutput>>>
/* highlight-next-line */
    ReadEnumAsync(CancellationToken token = default)
{
    ...
    var src = from obj in ctx.SalesPerson select obj;
    ...
    var qry = from obj in src
              select new SalesPerson_ReadEnumOutput() {
                  BusinessEntityId = obj.BusinessEntityId,
                  // CUSTOM_CODE_START: set the Description output parameter of ReadEnum operation below
/* removed-next-line */
                  // TODO: Description = obj.???, // CUSTOM_CODE_END
/* added-lines-start */
                  Description = obj.BusinessEntityObject.BusinessEntityObject.LastName + ", " +
                                obj.BusinessEntityObject.BusinessEntityObject.FirstName, // CUSTOM_CODE_END
/* added-lines-end */
                  // CUSTOM_CODE_START: set the IsCurrent output parameter of ReadEnum operation below
/* removed-next-line */
                  // TODO: IsCurrent = obj.???, // CUSTOM_CODE_END
/* added-next-line */
                  IsCurrent = obj.BusinessEntityObject.CurrentFlag, // CUSTOM_CODE_END
                  TerritoryId = obj.TerritoryId,
              };
    ...
```

In order to make sure that your inline customizations are [preserved if you run the *Clean* command](custom-result#caution-on-mixed-in-customizations) on the model, you can add an `svc:customize` config element to the `sales person` object, and set the `preserve-on-clean="true"` attribute, as follows.

```xml title="sales_person.xom"
    <config>
      <sql:table name="Sales.SalesPerson"/>
<!-- added-next-line -->
      <svc:customize preserve-on-clean="true"/>
    </config>
```

## Configuring multi-value criteria

Let's also allow filtering sales orders by multiple salespersons, by making the `sales person id` criteria multi-value.

All you have to do for that is to simply set the `list` attribute to `true `on the corresponding input parameter element of the sales order's `read list` operation, as shown below.

```xml title="sales_order.xom"
    <operation name="read list" type="readlist">
      <input>
        <struct name="criteria">
          ...
          <param name="sales person id operator" type="operator">[...]
          <!-- highlight-next-line -->
          <param name="sales person id" required="false" list="true"/>
          <config>
            <xfk:add-to-object class="SalesOrderCriteria"/>
          </config>
        </struct>
      </input>
      <output list="true">[...]
    </operation>
```

## Configuring custom labels

Finally, we will update the labels for the `sales person id` and `sales territory id` criteria and result list columns, since they will no longer display the internal ID.

```xml
    <xfk:data-object class="SalesOrderCriteria">
<!-- added-lines-start -->
      <ui:display>
        <ui:fields>
          <ui:field param="sales person id" label="Sales Person"/>
          <ui:field param="territory id" label="Sales Territory"/>
        </ui:fields>
      </ui:display>
    </xfk:data-object>
<!-- added-lines-end -->
    <xfk:data-object class="SalesOrderList" list="true">
      <ui:display>
        <ui:fields>
          <ui:field param="sales order id" hidden="true"/>
          <ui:field param="online order flag" label="Online" width="20px"/>
          <ui:field param="sales order number" label="SO#" width="10%"/>
<!-- added-lines-start -->
          <ui:field param="sales person id" label="Sales Person"/>
          <ui:field param="territory id" label="Sales Territory"/>
<!-- added-lines-end -->
        </ui:fields>
      </ui:display>
```

## Reviewing the results

Now, following an already familiar procedure, we will build the model again to regenerate all the artifacts, and then run the application.

If you open the *Sales Order List* screen, you'll see that the *Search Criteria* panel features a drop-down list to select a sales territory, and a list box to select multiple salespersons.

![Criteria enum.png](img6/criteria-enum.png)


You can check that the filtering also works for the multi-value criteria when you hit *Search*, and the results grid will look as depicted below.

![Results enum](img6/results-enum.png)

As you see, both Sales Person and Sales Territory now show their display names rather than IDs in both the results list and the search criteria summary above the grid.

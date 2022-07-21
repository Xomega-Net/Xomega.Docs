---
sidebar_position: 11
---

# 3.10 Standard contextual selection

In this section we will use a similar technique to set up contextual selection for the *Credit Card Id* on the *Payment* tab, but we'll use Xomega Framework support to minimize the custom code needed for standard cases.

## Overview of updates

Instead of showing a text field to enter ID of a stored credit card, we will display a dropdown list with the credit cards stored for the current customer's person. We will move both the credit card selection and the *Credit Card Approval Code* fields to a child panel *Credit Card* under the *Payment* tab.

![Credit card ID](img10/credit-card-id.png)

When the user selects a credit card, we'll display additional credit card details in the same *Credit Card* child panel.

## Defining contextual enumeration

We will start by defining a contextual dynamic enumeration that returns a list of credit cards with their details for a specific person.

### Configuring credit card types

First off, let's define some common credit card related types in the `credit_card.xom` file, and update the corresponding `credit card` object's fields to use these types, as displayed below.

```xml title="credit_card.xom"
  <types>
<!-- highlight-start -->
    <type name="credit card" base="integer enumeration"/>
    <type name="credit card number" base="string" size="25"/>
<!-- highlight-end -->
  </types>
  <objects>
    <object name="credit card">
      <fields>
        ...
<!-- highlight-next-line -->
        <field name="card number" type="credit card number" required="true">
        ...
      </fields>
    </object>
  </objects>
```

We also changed the base type for the `credit card` type from `integer key` to `integer enumeration` to enable selection.

### Adding contextual enumeration

Similar to what we did before, we will run the *Enumeration Read List* generator on the `person_credit_card.xom` file, and then we'll update the generated `read list` operation to make the `business entity id` an input parameter, and will add it to the `uri-template` of the REST method.

We will make the operation return credit card fields using their types from the `credit card` object, and will also define a dynamic enumeration with the `xfk:enum-cache` element, as illustrated below.

```xml title="person_credit_card.xom"
<object name="person credit card">
    ...
    <operation name="read list" type="readlist">
      <input>
<!-- highlight-next-line -->
        <param name="business entity id" type="person" required="true"/>
      </input>
      <output list="true">
        <param name="credit card id" type="credit card" required="true"/>
<!-- highlight-start -->
        <param name="credit card name" type="name" required="true"/>
        <param name="person name" type="name" required="true"/>
        <param name="card type" type="name" required="true"/>
        <param name="card number" type="credit card number" required="true"/>
        <param name="exp month" type="tiny int" required="true"/>
        <param name="exp year" type="small int" required="true"/>
<!-- highlight-end -->
      </output>
      <config>
        <rest:method verb="GET" uri-template="person/{business entity id}/credit-card"/>
<!-- highlight-start -->
        <xfk:enum-cache enum-name="person credit card"
                        id-param="credit card id" desc-param="credit card name"/>
<!-- highlight-end -->
      </config>
    </operation>
    ...
</object>
```

### Custom service implementation

To provide custom service implementation for our output parameters, let's build the model project and open the generated `PersonCreditCardService` class. We'll update our `ReadListAsync` operation to read all the credit card parameters, where we will return the credit card name as the card type, and the last four digits of the card number, as follows.

```cs title="PersonCreditCardService.cs"
public partial class PersonCreditCardService : BaseService, IPersonCreditCardService
{
    ...
    public virtual async Task<Output<ICollection<PersonCreditCard_ReadListOutput>>>
        ReadListAsync(int _businessEntityId, CancellationToken token = default)
    {
        ...
        var qry = from obj in src
                  select new PersonCreditCard_ReadListOutput() {
                    CreditCardId = obj.CreditCardId,
                    // CUSTOM_CODE_START: set the CreditCardName output parameter of ReadList operation below
// highlight-start
                    CreditCardName = obj.CreditCardObject.CardType + "-*" +
                                     obj.CreditCardObject.CardNumber.Substring(
                                        obj.CreditCardObject.CardNumber.Length - 4), // CUSTOM_CODE_END
// highlight-end
                    // CUSTOM_CODE_START: set the PersonName output parameter of ReadList operation below
// highlight-start
                    PersonName = obj.BusinessEntityObject.LastName + ", " +
                                 obj.BusinessEntityObject.FirstName, // CUSTOM_CODE_END
// highlight-end
                    // CUSTOM_CODE_START: set the CardType output parameter of ReadList operation below
// highlight-next-line
                    CardType = obj.CreditCardObject.CardType, // CUSTOM_CODE_END
                    // CUSTOM_CODE_START: set the CardNumber output parameter of ReadList operation below
// highlight-next-line
                    CardNumber = obj.CreditCardObject.CardNumber, // CUSTOM_CODE_END
                    // CUSTOM_CODE_START: set the ExpMonth output parameter of ReadList operation below
// highlight-next-line
                    ExpMonth = obj.CreditCardObject.ExpMonth, // CUSTOM_CODE_END
                    // CUSTOM_CODE_START: set the ExpYear output parameter of ReadList operation below
// highlight-next-line
                    ExpYear = obj.CreditCardObject.ExpYear, // CUSTOM_CODE_END
                  };
        ...
    }
}
```

## Credit Card grouping object

To group credit card fields into a child panel, let's fiend a data object `CreditCardPaymentObject`, and add it as a child of the `SalesOrderPaymentObject` using `credit card` as the name, as shown below.

```xml title="sales_order.xom"
  <xfk:data-objects>
<!-- highlight-next-line -->
    <xfk:data-object class="CreditCardPaymentObject"/>
    ...
    <xfk:data-object class="SalesOrderPaymentObject">
<!-- highlight-next-line -->
      <xfk:add-child name="credit card" class="CreditCardPaymentObject"/>
      <ui:display>[...]
    </xfk:data-object>
  </xfk:data-objects>
```

Next, we will add a generic `credit card info` structure for this object to add fields to it, as shown below.

```xml
  <struct name="credit card info" object="credit card">
    <param name="credit card id"/>
    <param name="card number"/>
    <param name="expiration" type="string"/>
    <config>
<!-- highlight-next-line -->
      <xfk:add-to-object class="CreditCardPaymentObject"/>
    </config>
<!-- highlight-next-line -->
    <usage generic="true"/>
  </struct>
```

Now we can configure our data object to make credit card non-key fields read-only, and to set a proper label for the `credit card id`, as follows.

```xml
  <xfk:data-object class="CreditCardPaymentObject">
    <ui:display>
      <ui:fields>
<!-- highlight-start -->
        <ui:field param="credit card id" label="Credit Card"/>
        <ui:field param="card number" editable="false"/>
        <ui:field param="expiration" editable="false"/>
<!-- highlight-end -->
      </ui:fields>
    </ui:display>
  </xfk:data-object>
```

### Updating operation structures

Next we will move the `credit card id` and `credit card approval code` parameters from the `payment info` and `payment update` structures to a new structure `sales order credit card`, and will update both payment structures to use a reference to this new structure instead, as follows.

```xml
<!-- highlight-next-line -->
    <struct name="payment info" object="sales order">
      ...
<!-- removed-lines-start -->
      <param name="credit card id"/>
      <param name="credit card approval code"/>
<!-- removed-lines-end -->
<!-- added-next-line -->
      <struct name="credit card" ref="sales order credit card"/>
      ...
    </struct>
<!-- highlight-next-line -->
    <struct name="payment update" object="sales order">
      ...
<!-- removed-lines-start -->
      <param name="credit card id"/>
      <param name="credit card approval code"/>
<!-- removed-lines-end -->
<!-- added-next-line -->
      <struct name="credit card" ref="sales order credit card"/>
      ...
    </struct>
<!-- added-lines-start -->
    <struct name="sales order credit card" object="sales order">
      <param name="credit card id" required="true"/>
      <param name="credit card approval code"/>
      <config>
        <xfk:add-to-object class="CreditCardPaymentObject"/>
      </config>
    </struct>
<!-- added-lines-end -->
```

:::note
This new structure is different from the `credit card info` structure that we defined, since it's used specifically for the operations. It must be referenced using the same name `credit card`, as the one that we used for our child data object earlier.
:::

### Refactoring custom service code

Let's build the model project, and refactor our custom service code in the `SalesOrderServiceExtended.cs` to use the new structure, as follows.

```cs title="SalesOrderServiceExtended.cs"
public partial class SalesOrderService
{
    protected PaymentInfo GetPaymentInfo(SalesOrder obj) => new PaymentInfo()
    {
        ...
/* added-next-line */
        CreditCard = new SalesOrderCreditCard {
            CreditCardId = obj.CreditCardObject?.CreditCardId ?? 0,
            CreditCardApprovalCode = obj.CreditCardApprovalCode,
/* added-next-line */
        },
        CurrencyRate = obj.CurrencyRateObject?.RateString
    };

    protected async Task UpdatePayment(SalesOrder obj, PaymentUpdate pmt, CancellationToken token)
    {
        ...
/* removed-next-line */
        obj.CreditCardApprovalCode = pmt.CreditCardApprovalCode;
/* added-next-line */
        obj.CreditCardApprovalCode = pmt.CreditCard.CreditCardApprovalCode;
/* removed-next-line */
        obj.CreditCardObject = await ctx.FindEntityAsync<CreditCard>(currentErrors, token, pmt.CreditCardId);
/* added-lines-start */
        obj.CreditCardObject = await ctx.FindEntityAsync<CreditCard>(currentErrors, token,
                                                                     pmt.CreditCard.CreditCardId);
/* added-lines-end */
    }
    ...
}
```

## Contextual UI selection

Now we need to populate a list of person's credit cards for the selected customer on the sales order.

Since the customer and payment are sibling child objects on the sales order data object, we will implement this logic in their common parent object `SalesOrderObject`, so we'll need to customize it as follows.

```xml title="sales_order.xom"
    <xfk:data-object class="SalesOrderObject" customize="true">[...]
```

Let's build the model project and open up the generated `SalesOrderObjectCustomized.cs` file. We'll set up the local lookup cache loader for the `CreditCardIdProperty` using `PersonCreditCardReadListCacheLoader` generated for our enumeration.

Then, instead of manually listening to the updates of the `PersonIdProperty` and then refreshing the cache loader and updating the `CreditCardIdProperty`, we'll just call the `SetCacheLoaderParameters` method with the generated constant for the input parameter name and the source property, and Xomega Framework will automatically handle all the rest.

The following snippet illustrates this logic.

```cs title="SalesOrderObjectCustomized.cs"
using AdventureWorks.Services.Common;
using AdventureWorks.Services.Common.Enumerations;

public class SalesOrderObjectCustomized : SalesOrderObject
{
    ...
    // perform post initialization
    protected override void OnInitialized()
    {
        base.OnInitialized();
// highlight-start
        var ccProp = PaymentObject.CreditCardObject.CreditCardIdProperty;
        ccProp.LocalCacheLoader = new PersonCreditCardReadListCacheLoader(ServiceProvider);
        ccProp.SetCacheLoaderParameters(PersonCreditCard.Parameters.BusinessEntityId,
                                        CustomerObject.PersonIdProperty);
// highlight-end
    }
}
```

:::tip
If a list of possible values in your property depends on values of multiple other properties, then you can call `SetCacheLoaderParameters` for each such property/input parameter, and the framework will update the list whenever either of those properties changes.
:::

## Populating credit card on selection

Now, in order to display the credit card details whenever a credit card is selected on the screen, we'll need to populate the read-only properties in the customized `CreditCardPaymentObject`. So let's add `customize="true"` to it in the model, and build the model project to generate the customization file.

```xml title="sales_order.xom"
    <xfk:data-object class="CreditCardPaymentObject" customize="true">[...]
```

 We'll add a credit card change listener in the `OnInitialized` method, which will populate other properties from the credit card attributes. The expiration property will combine both expiration month and year, as shown below.

```cs title="CreditCardPaymentObjectCustomized.cs"
using AdventureWorks.Services.Common.Enumerations;

public class CreditCardPaymentObjectCustomized : CreditCardPaymentObject
{
    ...
    // perform post initialization
    protected override void OnInitialized()
    {
        base.OnInitialized();
// highlight-next-line
        CreditCardIdProperty.Change += OnCreditCardChanged;
    }

    private void OnCreditCardChanged(object sender, PropertyChangeEventArgs e)
    {
        if (e.Change.IncludesValue() && !Equals(e.OldValue, e.NewValue))
        {
// highlight-start
            Header cc = CreditCardIdProperty.Value;
            CardNumberProperty.SetValue(cc?[PersonCreditCard.Attributes.CardNumber]);
            ExpirationProperty.SetValue(cc == null ? null : cc[PersonCreditCard.Attributes.ExpMonth]
                                                    + "/" + cc[PersonCreditCard.Attributes.ExpYear]);
// highlight-end
        }
    }
}
```

## Reviewing the results

Let's run the application, and review our changes. The *Payment* tab should now look as shown below.

![Credit card selection](img10/cc-selection.png)

As you see, we're displaying a list of person's saved credit cards using the credit card type and the last four digits of the card number now, and show specific credit card details when one is selected from the list.

If you change the customer on the *Customer* tab, the list of credit cards will be automatically refreshed, and the credit card fields will be blanked out until you select a new credit card.
---
sidebar_position: 2
---

# 2.1 Model the results list

We will start with tailoring result columns in the search view by updating the output parameters of the `read list` operation on the `sales order` object. This is where we need to take a look at the output parameters, and decide which ones we want to remove, which ones we want to add, what is the order we want them to go in, and which parameters may need to use a different type from the type of the corresponding field on the object, so that they could be displayed differently on the screen.

For example, the dates on the sales order, such as the `order date` or the `ship date`, are stored as `date/time` in the database, and hence their fields are defined like that on the object as well. But it makes more sense to display them as just dates, without the time component, so we'll override their type on the output parameters to be just `date`.

So let's go ahead and remove unnecessary columns, move `sales order number` to the top, and make other updates to the `read list` output. The diff below shows parameters that we removed or added, and shows parameters that we updated by setting a specific type.

```xml title="sales_order.xom"
  <object name="sales order">
    ...
    <operations>
      <operation name="read list" type="readlist">
        <input>[...]
        <output list="true">
          <param name="sales order id"/>
<!-- added-next-line -->
          <param name="sales order number"/>
<!-- removed-next-line -->
          <param name="revision number"/>
<!-- highlight-start -->
          <param name="order date" type="date"/>
          <param name="due date" type="date"/>
          <param name="ship date" type="date"/>
<!-- highlight-end -->
          <param name="status"/>
          <param name="online order flag" type="yesno" required="true"/>
<!-- removed-lines-start -->
          <param name="sales order number"/>
          <param name="purchase order number"/>
          <param name="account number"/>
          <param name="customer id"/>
<!-- removed-lines-end -->
<!-- added-lines-start -->
          <param name="customer store" type="string"/>
          <param name="customer name" type="string"/>
<!-- added-lines-end -->
          <param name="sales person id"/>
          <param name="territory id"/>
<!-- removed-lines-start -->
          <param name="bill to address id"/>
          <param name="ship to address id"/>
          <param name="ship method id"/>
          <param name="credit card id"/>
          <param name="credit card approval code"/>
          <param name="currency rate id"/>
          <param name="sub total"/>
          <param name="tax amt"/>
          <param name="freight"/>
<!-- removed-lines-end -->
          <param name="total due"/>
<!-- removed-lines-start -->
          <param name="comment"/>
          <param name="rowguid"/>
          <param name="modified date"/>
<!-- removed-lines-end -->
          <config>
            <!-- highlight-next-line -->
            <xfk:add-to-object class="SalesOrderList"/>
          </config>
        </output>
      </operation>
    </operations>
  </object>
```

The customer in the AdventureWorks schema is a business entity that may be either an individual person or a store, which could also have a contact person. To display that properly on the *Sales Order List*, we will show it as two separate fields: `customer store` and `customer name`. Since neither of them matches a specific field on the object, we will need to qualify them with a logical type (e.g. `string`).

---
sidebar_position: 1
sidebar_label: Overview
pagination_label: 2. Model the search view
---

# 2. Model the search view

As you saw in the previous section, the generated basic search form is showing all possible object fields in the results grid, and allows filtering by all of these fields. This is all based entirely on the structure of the `read list` operation that was generated in the model. The result fields are based on the output of this operation, and the criteria are based on the input.

```xml title="sales_order.xom"
<object name="sales order">
    ...
    <operations>
        <operation name="read list" type="readlist">
            <input>
                <!-- highlight-next-line -->
                <struct name="criteria">[...]
            </input>
            <!-- highlight-next-line -->
            <output list="true">[...]
        </operation>
    </operations>
</object>
```

Let's go ahead and update our model, so that the search screen would display only appropriate basic information about sales orders, and provide only the essential search criteria without overwhelming the screen, while the rest of the information would be displayed separately on the details view.

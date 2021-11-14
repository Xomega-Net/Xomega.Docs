---
sidebar_position: 1
---

# Overview

import UnderConstruction from  '@site/under-construction.mdx'

<UnderConstruction />

Test C#

```diff title="MyObj.cs"
// perform post intialization
protected override void OnInitialized()
{
    base.OnInitialized();
    // highlight-next-line
    StatusProperty.DisplayFormat = $"{Header.FieldId} - {Header.FieldText}";
    TerritoryIdProperty.SetCascadingProperty(Enumerations.SalesTerritory.Attributes.Group, GlobalRegionProperty);
-    SalesPersonIdProperty.SetCascadingProperty(Enumerations.SalesPerson.Attributes.TerritoryId, TerritoryIdProperty);
+   SalesPersonIdProperty.NullsMatchAnyCascading = true;
    SalesPersonIdProperty.DisplayListSeparator = "; ";

    // highlight-start
    if (CurrentPrincipal.IsStoreContact() || CurrentPrincipal.IsIndividualCustomer())
    {
        CustomerStoreOperatorProperty.AccessLevel = AccessLevel.None;
        CustomerNameOperatorProperty.AccessLevel = AccessLevel.None;
    }
    // highlight-end
}
```

Test XML

```diff title="sales_obj.xom"
<xfk:data-object class="SalesOrderList" list="true">
    <ui:display>
    <ui:fields>
        <ui:field param="sales order id" hidden="true"/>
        <ui:field param="sales order number" label="SO#"/>
        <ui:field param="online order flag" label="Online"/>
        <ui:field param="sales person id" label="Sales Person"/>
        <ui:field param="territory id" label="Sales Territory"/>
    </ui:fields>
    </ui:display>
-    <ui:link name="details" view="SalesOrderView" child="true" mode="inline">
+    <ui:params>
+        <ui:param name="sales order id" field="sales order id"/>
+    </ui:params>
    <ui:display on-field="sales order number" on-selection="true"/>
    </ui:link>
    <ui:link name="new" view="SalesOrderView" child="true" <mark>mode="inline"</mark>>
    <ui:params>
        <ui:param name="_action" value="create"/>
    </ui:params>
    <!-- highlight-next-line -->
    <ui:display title="New Order" access-key="N"/>
    </ui:link>
    <blazor-controls xmlns="http://www.xomega.net/xsf">
    <!-- highlight-start -->
    <XSfGrid AllowPaging="true" AllowReordering="true" AllowResizing="true"
             AllowSelection="true" AllowSorting="true" ShowColumnChooser="true" ShowColumnMenu="false">
        <XSfGridSelectionSettings PersistSelection="true"/>
        <GridSearchSettings IgnoreCase="true" />
        <GridPageSettings PageSizes="true" />
    </XSfGrid>
    </blazor-controls>
    <!-- highlight-end -->
</xfk:data-object>
```
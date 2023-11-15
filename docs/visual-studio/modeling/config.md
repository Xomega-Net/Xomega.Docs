---
sidebar_position: 7
pagination_next: null
---

# Global Configuration

Xomega model project allows a single top-level `config` node, where you can specify a global model configuration that is not tied to any element. By default, it will be in the `global_config.xom` file, and allows various configurations for individual extensions in their respective namespaces.

The global model configuration is used to provide a configuration that needs to be shared between multiple generators, as well as a complex configuration that cannot be easily specified by a generator parameter.

For example, generators of any classes that use the generated service contracts, such as data objects or service implementations, need to know the namespace for the service contracts, so it cannot be just a parameter of the [Service Contracts generator](../../generators/services/contracts).

:::tip
To find out which configurations are used by each generator, you can also check the documentation on that generator.
:::

Below are some quick descriptions of the existing global configurations.

## Services config

This section configures the generation of [service contracts](../../generators/services/contracts) and [implementations](../../generators/services/service-impl), including TypeScript ones, as follows.

```xml title="global_config.xom"
<config xmlns="http://www.xomega.net/omodel"
        xmlns:svc="http://www.xomega.net/svc">
  ...
  <svc:services-config async="true"
                       cancellation="true"
                       namespace="DemoSolution.Services.Common"
                       implNamespace="DemoSolution.Services.Entities"
                       tsOutputPath="../DemoSolution.Client.Spa/ServiceContracts/\{Module/\}\{File\}"/>
</config>
```

:::note
As you can see from the `tsOutputPath` attribute above, the output path for generated TypeScript objects can also be specified in the global configuration rather than as individual generator parameters.

This is because the generated TypeScript files that use other generated TypeScript files need to know their exact location in order to properly include them, unlike C# files that just need to know the namespace.
:::

## WCF config

This section provides the configuration of WCF endpoints, which is used both on the [server side](../../generators/services/wcf-config) and on any [client that uses WCF services](../../generators/presentation/common/wcf-config), as follows.

```xml title="global_config.xom"
<config xmlns="http://www.xomega.net/omodel"
        xmlns:wcf="http://www.xomega.net/wcf">
  ...
  <wcf:config>
    <wcf:endpoint-config binding="ws2007FederationHttpBinding"
                         bindingConfiguration="message"
                         baseLocalAddress=""
                         baseRemoteAddress="http://localhost:61436/\{Module/\}\{File\}.svc"/>
  </wcf:config>
</config>
```

:::note
You need to provide this global configuration in order to enable WCF services and endpoints in your application.
:::

## Data objects config

This section configures the [generation of Xomega Framework data objects](../../generators/presentation/common/data-objects), including TypeScript ones, as follows.

```xml title="global_config.xom"
<config xmlns="http://www.xomega.net/omodel"
        xmlns:xfk="http://www.xomega.net/framework">
  ...
  <xfk:data-objects-config namespace="DemoSolution.Client.Common.DataObjects"
                           assembly="DemoSolution.Client.Common"
                           tsOutputPath="../DemoSolution.Client.Spa/DataObjects/\{Module/\}\{File\}"/>
</config>
```

## Enumerations config

This section configures the generation of [constants for enumerations](../../generators/enums/enum-const) as follows.

```xml title="global_config.xom"
<config xmlns="http://www.xomega.net/omodel"
        xmlns:xfk="http://www.xomega.net/framework">
  ...
  <xfk:enumerations-config namespace="DemoSolution.Services.Common.Enumerations"/>
</config>
```

## Entities config

This section configures the generation of [domain entities](../../generators/data/entities) as follows.

```xml title="global_config.xom"
<config xmlns="http://www.xomega.net/omodel"
        xmlns:edm="http://www.xomega.net/edm">
  ...
  <edm:entities-config efCore="true"
                       namespace="DemoSolution.Services.Entities"
                       context="DemoSolutionEntities"/>
</config>
```

## UI controls

This section provides the default configuration for Xomega Blazor controls in the `ui:blazor-controls` element, specifically the `XGrid`, for the [Blazor Views generator](../../generators/presentation/blazor/views). This configuration can be overridden on each specific list data object in the model.

It also specifies the paths to the customizable Web Forms user controls and the master page for [ASP.NET Views generator](../../generators/presentation/webforms/views) under the `ui:user-controls` element. The following snippet illustrates this configuration.

```xml title="global_config.xom"
<config xmlns="http://www.xomega.net/omodel"
        xmlns:ui="http://www.xomega.net/ui">
  ...
  <ui:controls-config>
    <!-- default configuration of Xomega Blazor controls -->
<!-- highlight-next-line -->
    <ui:blazor-controls>
      <ui:XGrid/>
    </ui:blazor-controls>

    <!-- paths to WebForms user controls and the master page -->
<!-- highlight-next-line -->
    <ui:user-controls>
      <ui:user-control name="AppliedCriteria" path="Controls/AppliedCriteria"/>
      <ui:user-control name="CollapsiblePanel" path="Controls/CollapsiblePanel"/>
      <ui:user-control name="DateTimeControl" path="Controls/Editors/DateTimeControl"/>
      <ui:user-control name="PickListControl" path="Controls/Editors/PickListControl"/>
      <ui:user-control name="Errors" path="Controls/Errors"/>
      <ui:user-control name="ViewTemplate" path="Site.Master"/>
    </ui:user-controls>
  </ui:controls-config>
</config>
```

## Syncfusion Blazor controls

This section provides the default configuration for Xomega Syncfusion Blazor controls in the `blazor-controls-config` element, specifically the `XSfGrid`, for the [Syncfusion Blazor Views generator](../../generators/presentation/blazor/views-xsf), as follows.

```xml title="global_config.xom"
<config xmlns="http://www.xomega.net/omodel">
  ...
  <!-- highlight-next-line -->
  <blazor-controls-config xmlns="http://www.xomega.net/xsf">
    <XSfGrid AllowPaging="true" AllowReordering="true" AllowResizing="true"
            AllowSelection="true" AllowSorting="true" ShowColumnChooser="true" ShowColumnMenu="false">
      <XSfGridSelectionSettings PersistSelection="true"/>
      <GridSearchSettings IgnoreCase="true" />
      <GridPageSettings PageSizes="true" />
    </XSfGrid>
  </blazor-controls-config>
</config>
```

This configuration can be overridden on each specific list data object in the model.

:::note
The above example uses a custom namespace without a prefix for convenience in order to allow you to easily copy and paste the `XSfGrid` element from the `.razor` pages.

Alternatively, you can set it up with a prefix, e.g., `xsf`, but you'd have to use it on all nested elements, as follows.

```xml
<xsf:blazor-controls-config xmlns:xsf="http://www.xomega.net/xsf">
  <xsf:XSfGrid AllowPaging="true" AllowReordering="true" AllowResizing="true"...>[...]
</xsf:blazor-controls-config>
````
:::

## Legacy layout configs

This section allows configuring named layouts that can be referenced from the model views and are used for legacy views generation, such as [ASP.NET Views](../../generators/presentation/webforms/views), [WPF](../../generators/presentation/wpf/views), or [SPA Views](../../generators/presentation/spa/views). The snippet below illustrates this configuration.

```xml title="global_config.xom"
<config xmlns="http://www.xomega.net/omodel"
        xmlns:ui="http://www.xomega.net/ui">
  ...
  <ui:layout-config>
<!-- highlight-next-line -->
    <ui:layout name="standard" default="true">
      <ui:list details-mode="popup">
        <ui:criteria>
          <ui:fields columns="2" flow="vertical"/>
          <ui:errors position="bottom"/>
        </ui:criteria>
      </ui:list>
      <ui:details>
        <ui:fields columns="2" flow="vertical"/>
        <ui:errors position="top"/>
        <ui:children layout="tabs"/>
      </ui:details>
      <ui:description>Standard layout for list view with popup details</ui:description>
    </ui:layout>
<!-- highlight-next-line -->
    <ui:layout name="master-details" base="standard">
      <ui:list details-mode="inline"/>
      <ui:description>Display of list view with a side details panel</ui:description>
    </ui:layout>
  </ui:layout-config>
</config>
```

:::caution
This configuration is not used by the modern [Blazor Views](../../generators/presentation/blazor/views) generators, as those utilize the latest, more flexible layout configuration on each individual data object.
:::

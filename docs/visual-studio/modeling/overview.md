---
sidebar_position: 1
---

# Model Structure

The structure of the Xomega models is defined by extensible XSD schemas, which govern what elements and attributes are allowed in the model within each element, what order do these elements go in, the types of allowed values, as well as specific enumerations for attributes that allow values only from a strict list.

## Schemas and namespaces

The core model is defined in the `http://www.xomega.net/omodel` namespace, which covers the general structure of the model, and includes basic domain and service model elements. This is usually a default namespace that is used without a prefix in the model.

In addition to the core model elements, Xomega allows layer-specific or custom extensions, that are defined in separate namespaces and would require their own prefix. Those are also defined by separate XSD schemas.

The following table outlines the standard set of schemas and extensions that are included in Xomega.Net, as well as their namespaces and the default prefixes.

|Prefix|Namespace|Description|Schema|
|-|-|-|-|
||`http://www.xomega.net/omodel`|Defines the core model structure.|Xomega.xsd|
|xfk|`http://www.xomega.net/framework`|Defines Xomega Framework data objects and configurations.|Xomega_Framework.xsd|
|sql|`http://www.xomega.net/sql`|Defines database-specific configurations.|Xomega_SQL.xsd|
|clr|`http://www.xomega.net/clr`|Defines C#-specific configurations.|Xomega_CLR.xsd|
|edm|`http://www.xomega.net/edm`|Defines Entity Framework configurations.|Xomega_EDM.xsd|
|svc|`http://www.xomega.net/svc`|Defines service layer configurations.|Xomega_Services.xsd|
|rest|`http://www.xomega.net/rest`|Defines REST API configurations.|Xomega_REST.xsd|
|wcf|`http://www.xomega.net/wcf`|Defines WCF-specific configurations.|Xomega_WCF.xsd|
|ui|`http://www.xomega.net/ui`|Defines UI views and UI-specific configurations.|Xomega_UI.xsd|
|xsf|`http://www.xomega.net/xsf`|Defines Syncfusion-specific configurations.|Xomega_XSF.xsd|

## Modules definition

To help you better organize your model, Xomega uses a top-level `module` element in each file for all model elements except for the global configurations. Each module can have a `name` attribute, signifying the name of the module. If the `name` attribute is missing, the elements will be considered to be in the "default" module.

:::info
When importing your model from a SQL Server database, the module name will be the name of the database schema.
:::

:::note
Xomega modules are **not hierarchical**, and you cannot nest them within each other. They also **don't serve as namespaces**, so any names you use for model elements must be globally unique.

All modules do is provide a simple way for grouping related model elements.
:::

Modules can be used to output generated artifacts under separate folder for each module, which helps you better manage the generated code. In certain cases, modules can be also adopted to represent **microservices**, so that the generated artifacts for each module would go into their own individual microservice. Here's where you can learn more on [using modules in output paths](../model-project/configuring-generators.md#output-paths).

:::tip
The best practice is to place model files for the same module into the same folder, in order to keep your model project well organized.
:::

The structure of the `module` element with descriptions is illustrated in the following snippet.

```xml
<module xmlns="http://www.xomega.net/omodel"
        xmlns:xfk="http://www.xomega.net/framework"
        xmlns:svc="http://www.xomega.net/svc"
        xmlns:rest="http://www.xomega.net/rest"
        xmlns:ui="http://www.xomega.net/ui"
        xmlns:sql="http://www.xomega.net/sql"
        xmlns:clr="http://www.xomega.net/clr"
        xmlns:edm="http://www.xomega.net/edm"
<!-- highlight-next-line -->
        name="my module">

  <doc>[...] <!-- allows you to provide some documentation for the module.
                  This would be typically in a dedicated file with no other elements. -->

  <types>[...] <!-- definitions of logical types -->
  
  <fieldsets>[...] <!-- definitions of reusable field-sets -->  

  <enums>[...] <!-- static data enumerations with their items and any additional properties -->
  
  <structs>[...] <!-- definitions of reusable structures for service operations -->
  
  <objects>[...] <!-- definitions of domain objects and their operations -->
  
<!--
   The elements above should follow the order they are listed in, when present.
   You cannot specify more than one element, but you can omit any element.
   The elements below can be listed in any order at the end, if present.
-->

  <xfk:data-objects>[...] <!-- definitions of Xomega Framework data objects,
                               which are used by the view models -->
  
  <ui:views>[...] <!-- definitions of UI views in the model -->  

</module>
```

You can read more details on the elements in each grouping in the following sections.

## Element documentation

Most model elements have an associated child element `doc` to allow you to maintain good documentation for any such element right in the model.

You can provide a short description for the element under the nested `summary` tag, and also have more detailed documentation in plain text in the remainder of the `doc` element, as follows.

```xml
    <enum name="operators">
      <properties>
        <property name="multival" default="0">
<!-- highlight-start -->
          <doc>
            <summary>1 if the additional property can be multi-valued, 0 otherwise.</summary>
The name should be in synch with the constant AttributeMultival defined in the OperatorProperty class.
          </doc>
<!-- highlight-end -->
        </property>
      </properties>
      ...
    </enum>
```

:::note
This is similar to the documentation that you provide on regular C# elements.
:::

These descriptions can be displayed in the model editors as tooltips on the corresponding references, or when selecting them via IntelliSense dropdown lists or in the *Symbol Browser* view, which can help you better understand your model as you browse or edit it.

They are also output as C# documentation on the generated classes, which would help you when using those generated classes in your custom code, or when debugging the generated code.

Finally, you can also generate technical design docs from the model that will use the documentation you provided. This will allow you to communicate the model design with other developers or stakeholders, and make sure such documentation is always up-to-date.

## Element configuration

All essential elements in the Xomega model have a dedicated child node `config`, where you can specify additional specific configuration from a custom namespace, which can be used by different generators.

For example, a logical type `money` may have additional custom configuration with a mapping to the corresponding SQL type, the Xomega Framework property, and a UI display configuration, as follows.

```xml
<type name="money" base="decimal">
<!-- highlight-start -->
  <config>
    <sql:type name="money" db="sqlsrv"/>
    <xfk:property class="MoneyProperty" namespace="Xomega.Framework.Properties" tsModule="xomega"/>
    <ui:display-config typical-length="12"/>
  </config>
<!-- highlight-end -->
  <usage generic="true"/>
</type>
```

Similarly, an `address` object may be mapped to a specific database table using a `sql:table` configuration, as follows.

```xml
<object name="address">
  <fields>[...]
<!-- highlight-start -->
  <config>
    <sql:table name="Person.Address"/>
  </config>
<!-- highlight-end -->
</object>
```

:::note
The `config` nodes also serve as extension points where you can supply your own configuration for your custom generators.
:::

## Global configuration

Xomega model project allows a single top-level `config` node, where you can specify [global model configuration](config.md) that is not tied to any element. By default, it will be in the `global_config.xom` file, and allows various configurations for individual extensions in their respective namespaces.

The global model configuration is used to provide configuration that needs to be shared between multiple generators, as well as complex configuration that cannot be easily specified by a generator parameter.

:::tip
To see how it is used by individual generators, you can check the [documentation on each specific generator](../../generators/overview.md).
:::

---
sidebar_position: 1
---

# Service Contracts

Generates C# service interfaces with methods for all operations on an object or its subobjects, as well as data structures for input and output of such operations, and for any standalone reusable structures declared in the model.

:::note
To allow exposing the services through WCF, those interfaces and data structures can be also decorated with `ServiceContract` or `DataContract` attributes, or other WCF attributes as needed.
:::

## Generator inputs

Any object in the Xomega model that has operations, or subobjects with operations, represents a service. Configuration of such operations and any supporting structures in the model is used to generate the service and data contracts.

### Operations

The service name will be based on the object name with a "Service" postfix, and an "I" prefix following .Net standards, e.g. `ISalesOrderService`. The name of a service method will be based on the name of the corresponding operation, potentially prefixed with the name of the subobject to ensure that they don't clash with other methods.

For the input and output structures, as well as any inline structures nested within those, there will be generated a dedicated structure with a fully qualified name. For example, for the inline structure data nested inside the input of the sales order's update operation that is shown below, the name of the generated structure will be `SalesOrder_UpdateInput_Data`.

```xml
<objects>
<!-- highlight-next-line -->
  <object name="sales order">
    <fields>...</fields>
    <operations>
      <operation name="create" type="create">[...]
      <operation name="read" type="read">[...]
<!-- highlight-start -->
      <operation name="update" type="update">
        <input>
<!-- highlight-end -->
          <param name="sales order id"/>
<!-- highlight-next-line -->
          <struct name="data">
            <param name="status"/>
            <param name="purchase order number"/>
            <struct name="customer" ref="customer update"/>
            <struct name="payment" ref="payment update"/>
            <param name="comment"/>
          </struct>
        </input>
      </operation>
      <operation name="delete" type="delete">[...]
      <operation name="read list" type="readlist">[...]
    </operations>
  </object>
</objects>
```

### Structures

Instead of inline structures defined directly inside the service operations, you can just reference a named structure that is defined globally in the model.

For example, the `customer update` and `payment update` structures that are referenced in the previous example, can be defined under the `structs` top-level element in the model as follows.

```xml
<structs>
<!-- highlight-next-line -->
  <struct name="customer update" object="customer">
    <param name="customer id"/>
    <struct name="billing address" ref="address key"/>
    <struct name="shipping address" ref="address key"/>
  </struct>
<!-- highlight-next-line -->
  <struct name="payment update" object="sales order">
    <param name="ship method id"/>
    <param name="due date" type="date"/>
    <struct name="credit card">
      <param name="credit card id" required="true"/>
      <param name="credit card approval code"/>
    </struct>
  </struct>
</structs>
```

The name of the generated class will be based on the name of the structure, e.g. `CustomerUpdate`, which should be unique as long as there are no other classes with this name defined in the services' namespace.

:::note
The standalone structures can in turn have parameters referencing other standalone structures, or can have other inline structures nested inside of them, which will be also generated using their fully qualified name.
:::

### CLR types

The CLR types that are used on the generated structures are determined based on the configuration of their logical types in the model.

If the logical type is not specified on the structure's parameter, then the type of the field with the same name on the corresponding object will be used, which is either the object that the operation is defined on, or the object referenced by the `object` attribute on a standalone structure.

The logical types usually inherit such configurations from their base types, but can override the CLR types to use as needed. You need to add the `clr:type` element under the `config` element of the type, and specify the CLR type's name and namespace, as well as whether it's a value type, as follows.

```xml
<type name="date time">
  <config>
<!-- highlight-next-line -->
    <clr:type name="DateTime" valuetype="true" namespace="System" xmlns:clr="http://www.xomega.net/clr"/>
  </config>
</type>
<type name="string">
  <config>
<!-- highlight-next-line -->
    <clr:type name="string" xmlns:clr="http://www.xomega.net/clr"/>
  </config>
</type>
```

:::note
Standard CRUD and `read list` operations for an object can be easily added automatically to the model by a special [model enhancement CRUD generator](../model/crud.md).
:::

## Generator outputs

This generator creates C# classes for service and data contracts, which can be placed in separate files by service, grouped by module, or output to a single file, depending on how you set up your *Output Path* parameter.

The standalone structures will be output in a separate file by module with a "Structures" postfix.

:::tip
Usually you want to output generated classes to a separate shared project that can be used by both the client and the server-side projects.
:::

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Service Contracts|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Service Layer|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Common /ServiceContracts/{Module/}{File}.cs|Relative path where to output files with generated service and data. The path may contain {Module/} and {File} placeholders to output files by module and data object respectively.|

### Model configuration

Configuration parameters for the generator that need to be also accessible to other generators are specified in the Xomega model in the `svc:services-config` element under the top level `config` element, which is conventionally placed in the `global_config.xom` file.

These parameters include whether the service operations are `async`, whether they include a `cancellation` token, and the `namespace` for the generated classes, as shown below.

```xml title="global_config.xom"
<!-- highlight-start -->
<svc:services-config async="true" cancellation="true"
                     namespace="MySolution.Services.Common"
<!-- highlight-end -->
                     xmlns:svc="http://www.xomega.net/svc"/>
```

:::tip
You should make the service operations async and support cancellation tokens where possible, unless you need to support legacy frameworks such as WCF or WebForms.
:::

The generated service interface and structures will be decorated with WCF attributes for service and data contracts only if WCF configuration is defined in the `wcf:config` element of the global model configuration under the top level `config` element, as illustrated below.

```xml title="global_config.xom"
<wcf:config xmlns:wcf="http://www.xomega.net/wcf">
  ...
</wcf:config>
```

### Common configurations

There expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator either for the entire model, or for individual files by selecting them in the model project, and running the generator from the context menu.

You can rerun the generator when you add or change object operations or structures in the model, which will require re-running other generators that depend on the same model elements, such as generators of UI views, data objects as well as service implementations.

:::note
Therefore, this generator should be included in the build of the model project in the configuration, in order to allow to easily regenerate all service and data contracts along with other artifacts.
:::

### Customizing the output

:::danger
You should never edit generated service and data contracts directly. This allows re-running the generator at any time without losing your customizations.
:::

#### WCF Attributes

If you need to provide additional custom WCF attributes beyond the basic `ServiceContract` and `DataContract` that will be generated if you have a `wcf:config` element in the model configuration, then you can add a `wcf:operation-attributes` element in the model to the `config` element of individual operations, or a `wcf:service-attributes` element to the `config` element of the object, as illustrated below.

```xml
<objects>
  <object name="sales order">
    <operations>
      <operation name="update" type="update">
        <input>...</input>
        <config>
<!-- highlight-start -->
          <wcf:operation-attributes>
            <wcf:OperationBehavior Impersonation="ImpersonationOption.Allowed"/>
            <wcf:TransactionFlow>
              <wcf:transactions>TransactionFlowOption.Allowed</wcf:transactions>
              </wcf:TransactionFlow>
          </wcf:operation-attributes>
<!-- highlight-end -->
        </config>
      </operation>
    </operations>
    <config>
<!-- highlight-start -->
      <wcf:service-attributes>
        <wcf:ServiceContract SessionMode="SessionMode.Allowed"/>
        <wcf:DeliveryRequirements RequireOrderedDelivery="true"/>
        <wcf:XmlSerializerFormat Use="OperationFormatUse.Encoded"/>
      </wcf:service-attributes>
<!-- highlight-end -->
    </config>
  </object>
</objects>
```

You can also exclude some operations from being exposed via WCF by adding a `wcf:operation` element to the operation's `config` with a `not-supported="true"` attribute, as follows.

```xml
<objects>
  <object name="sales order">
    <operations>
      <operation name="update" type="update">
        <input>...</input>
        <config>
<!-- highlight-next-line -->
          <wcf:operation not-supported="true"/>
        </config>
      </operation>
    </operations>
  </object>
</objects>
```

#### REST Attributes

If you want to expose some services via REST interface, you will need to add `rest:method` element to the `config` of each operation that you need exposed, as follows.

```xml
<objects>
  <object name="sales order">
    <operations>
      <operation name="update" type="update">
        <input>
          <param name="sales order id"/>
          <struct name="data">...</struct>
        </input>
        <config>
<!-- highlight-next-line -->
          <rest:method verb="PUT" uri-template="sales-order/{sales order id}"
                       xmlns:rest="http://www.xomega.net/rest"/>
        </config>
      </operation>
    </operations>
  </object>
</objects>
```

### Cleaning generator’s output

This generator supports cleaning either all generated service contracts, or only the ones from the selected model files using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the services from the model, and want the generated classes deleted.
:::
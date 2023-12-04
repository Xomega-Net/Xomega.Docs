---
sidebar_position: 4
---

# Service Model

Xomega service model consists of **service operations** defined for your domain objects, as well as various **service structures** that are used in those operations. You can define these structures either inline within the operation or another structure that it's used in or as an independent, reusable named structure that you can include by reference from multiple places.

:::note
These structures represent what is known as *data transfer objects* (DTO) or *data contracts* in WCF.
:::

## Service structures

You can define reusable named structures using `struct` elements inside the `structs` child of the `module` element. The `struct` element for the top-level structure must have a globally unique `name` attribute and contains an array of `param` or `struct` elements for its parameters and nested structures, respectively, followed by `config`, `usage`, and `doc` elements as needed.

The following snippet demonstrates the structure of service structures and provides some descriptions of each element.

```xml
<module xmlns="http://www.xomega.net/omodel">
  <structs>
<!-- highlight-next-line -->
    <struct name="my structure">

      <!-- an array of param/struct elements with unique names within the structure -->
      <param name="scalar value" type="my type" required="true"/>
      <param name="scalar array" type="my type" list="true"/>
      <struct name="referenced structure" ref="top level structure"/>
      <struct name="referenced table" ref="top level structure" list="true"/>
      <struct name="nested structure">[...]
      <struct name="nested table" list="true">[...]
      
      <config>[...] <!-- extensible additional configuration of the structure -->
      
      <usage>[...] <!-- usage specification on top-level structures only -->
      <doc>[...] <!-- documentation on top-level structures only -->
    </struct>
  </structs>
</module>
```

The `config` element is available on any level and allows you to supply additional configuration for its parent `struct` element.

:::note
Nested inline `struct` elements have the same structure, except that they don't have the `usage` and `doc` elements, which are available for top-level structures only.
:::

### Scalar parameters

In order to declare scalar parameters in a structure, you should use a `param` element, where you give the parameter a unique `name` and a logical type and also set the `required` flag or provide parameter documentation in the nested `doc` element, as follows.

```xml
<struct name="credentials">
  <param name="user id" type="user" required="true"/>
<!-- highlight-next-line -->
  <param name="password" type="plain password" required="true">
    <doc>
<!-- highlight-next-line -->
      <summary>Unhashed user password.</summary>
    </doc>
  </param>
</struct>
```

If your structure must have an array of scalar values, you just need to set the `list="true"` attribute on the `param` element. For example, to be able to filter by multiple statuses, you can make the `status` a multi-value parameter on the `order criteria` structure, as follows.

```xml
<struct name="order criteria">
<!-- highlight-next-line -->
  <param name="status" type="order status" list="true"/>
</struct>
```

If most of your structure parameters represent fields of some domain object, then you can specify the dot-separated fully qualified name of the object on the structure, e.g., `object="sales order.line item"` for the `line item` subobject of the `sales order` parent object.

In that case, for any parameters that have a field with the same name in the specified object, Xomega will be able to infer the logical type and the required flag from that field, so you won't need to specify them separately on the structure, as follows.

```xml
<!-- highlight-start -->
<struct name="credit card info" object="credit card">
  <param name="credit card id"/>
  <param name="card number"/>
<!-- highlight-end -->
  <param name="expiration" type="string"/>
</struct>
```

You would still need to specify the logical type on any parameters that don't match any of the object's fields or if you want to explicitly override the type or the required flag on that parameter.

### Nested structures

Xomega allows you to define arbitrarily deep and complex nested structures. You have the following two ways to define them, which you can mix and match to best suit your service model design.
- Define **inline structures** nested inside the parent structure.
- Define a **named standalone structure**, and reference it from your structure.

Defining nested inline structures is very convenient when it's very specific to your current structure, and you don't need to reuse it in any other structures. It can have its own parameters and structures, as well as specific configurations in the model. The following example shows a `credit card` structure as part of the `payment info` structure.

```xml
<struct name="payment info" object="sales order">
  <param name="sub total"/>
  <param name="tax amt"/>
  <param name="total due"/>
<!-- highlight-start -->
  <struct name="credit card">
    <param name="credit card id" required="true"/>
    <param name="credit card approval code"/>
  </struct>
<!-- highlight-end -->
</struct>
```

The name of the nested `struct` element should be unique within its parent structure and will be used to generate a globally unique, fully qualified name for the nested structure.

Alternatively, you can declare another reusable named structure at the top level and just reference it from your structure by name. Below we use the `address` structure in our `customer info` structure for both the `billing address` and `shipping address` parameters by specifying a `ref` attribute.

```xml
<!-- highlight-next-line -->
<struct name="address" object="address">
  <param name="street address"/>
  <param name="city"/>
  <param name="state"/>
  <param name="postal code"/>
</struct>
<!-- highlight-next-line -->
<struct name="customer info" object="customer">
  <param name="customer id"/>
  <param name="customer name" type="string" required="false"/>
  <param name="account number"/>
<!-- highlight-start -->
  <struct name="billing address" ref="address"/>
  <struct name="shipping address" ref="address"/>
<!-- highlight-end -->
</struct>
```

:::tip
If you have an inline nested structure that you need to reuse elsewhere, you can just copy it to the top-level `structs` element, give it a unique name, and then replace the inline structure with reference to that structure.
:::

As with the scalar parameters, you can easily turn a nested structure (both inline and referenced) into a list of structures by setting the `list="true"` attribute as follows.

```xml
<!-- highlight-next-line -->
<struct name="customer info" object="customer">
  <param name="customer id"/>
  <param name="customer name" type="string" required="false"/>
  <param name="account number"/>
<!-- highlight-start -->
  <struct name="addresses" ref="address" list="true"/>
<!-- highlight-end -->
</struct>
```

:::note
A `struct` parameter that references a declared structure cannot have nested parameters or structures, but it can have a nested `config` element.
:::

### Generic structures

If you declare a structure but don't reference it anywhere in your service model, Xomega will show you a warning that the structure is not being referenced to help you catch any issues with your model.

However, sometimes you may need to declare a structure that you are planning to use later or one that you need for other reasons than the service model. In this case, you can declare it as generic by setting the `generic="true"` attribute on its `usage` element, which will suppress the warning, as illustrated below.

```xml
<struct name="address info" object="address">
  <param name="address line1"/>
  <param name="address line2"/>
  <param name="city state" type="string"/>
  <param name="postal code"/>
  <param name="country" type="country region"/>
<!-- highlight-next-line -->
  <usage generic="true"/>
</struct>
```

:::note
This is similar to configuring generic logical types to suppress the warning that it's not referenced in the model.
:::

## Domain services

Domain services are defined by a set of operations that you can define on any domain object under its `operations` element. The operations can be defined both on aggregate root objects, as well as on subobjects. You can provide additional service configuration under the object's `config` element. The following snippet illustrates the standard CRUD operations for an object.

```xml
<module xmlns="http://www.xomega.net/omodel">
  <objects>
    <object name="sales order">
      <fields>[...]
<!-- highlight-next-line -->
      <operations>
        <operation name="read" type="read">[...]
        <operation name="create" type="create">[...]
        <operation name="update" type="update">[...]
        <operation name="delete" type="delete">[...]
        <operation name="read list" type="readlist">[...]
      </operations>
<!-- highlight-next-line -->
      <config>[...]
    </object>
  </objects>
</module>
```

:::note
Domain services line up well with the REST standards, where a domain object represents a resource, and the operations correspond to various methods for reading or updating its state.
:::

### Object operations

In addition to a unique `name` within the object, operations may have a `type` attribute, which helps Xomega determine one of the standard types of operations when generating the application code. The type can have one of the following values.
- `create` - operation creates a new object.
- `read` - operation returns the object's data by the unique object's key.
- `update` - operation updates object's data by unique object's key.
- `delete` - operation deletes an object by a unique object's key.
- `readlist` - operation reads a list of objects using specified criteria.

Setting the operation type will allow Xomega to call the proper operations from the standard UI actions, as well as generate appropriate service implementations for those operations.

Inside each operation, you can specify the following optional elements.
- `input` - operation's input structure that can be defined inline or reference an existing structure.
- `output` - operation's output structure that can be defined inline or reference an existing structure.
- `config` - additional configuration for the operation.
- `doc` - documentation for the operation.

:::note
You cannot specify more than one of each element, and they should go in the same order as they are listed above.
:::

The `input` and `output` of the operation have the same structure as the regular structures when you list parameters and nested structures inline. The current object that contains the operation will serve as a reference object for the inline structures, meaning that for any parameter that has an object field with the same name, Xomega can infer its type and required flag, so you don't need to specify them explicitly, unless you want to override them with a different value.

For example, the following `update` operation has input parameters and structures listed right under the `input` element, and its `data` parameter has its own parameters and referenced structures.

```xml
<operation name="update">
<!-- highlight-next-line -->
  <input>
    <param name="sales order id"/>
<!-- highlight-next-line -->
    <struct name="data">
      <param name="status"/>
      <param name="account number"/>
      <struct name="customer" ref="customer update"/>
      <struct name="payment" ref="payment update"/>
    </struct>
  </input>
<!-- highlight-next-line -->
  <output>
    <param name="revision number"/>
    <param name="modified date"/>
  </output>
<!-- highlight-start -->
  <config>[...] <!-- additional configuration for the operation -->
  <doc>[...] <!-- operation documentation -->
<!-- highlight-end -->
</operation>
```

When you specify input parameters, as shown above, the generated service method will have two separate arguments - `sales order id` and `data`. If, instead, you want Xomega to use a structure with these parameters as a single argument of the service method, then you need to set the name of the argument in the `arg` attribute as follows.

```xml
  <input arg="input">[...]
```

:::tip
Keeping separate input arguments works better for exposing services via REST since you can map some parameters to the URL path or query and designate a single structure argument for the request body.
:::

Instead of defining input and output structures inline, you can also define them as regular structures and then reference them on the `input` or `output` elements of any operation using a `struct` attribute, as follows.

```xml
<operation name="read list">
  <input struct="sales order criteria"/>
<!-- highlight-next-line -->
  <output struct="sales order row" list="true"/>
</operation>
```

Whether you use a referenced or inline structure, if your operation returns or accepts a list of objects, then you need to set the `list="true"` attribute on your `output` or `input` elements, respectively, just like you do on regular structures or parameters, as illustrated above.

:::note
The operation output must always be a structure or a list of structures, even if it has a single parameter. You cannot return a  scalar value or a list of values from an operation.
:::

### Subobject operations

In addition to defining operations on aggregate root objects, you can also add them to individual subobjects the same way as you define them on the root object. The subobject will be the reference object for the inline input and output structures of those operations, and the operation names should be unique within the subobject, as illustrated below.

```xml
<module xmlns="http://www.xomega.net/omodel">
  <objects>
    <object name="sales order">
      <fields>[...]
      <operations>
        <operation name="read" type="read">[...]
        <operation name="create" type="create">[...]
        <operation name="update" type="update">[...]
        <operation name="delete" type="delete">[...]
        <operation name="read list" type="readlist">[...]
      </operations>
      <config>[...]
      <subobjects>
<!-- highlight-next-line -->
        <object name="line item">
          <fields>[...]
<!-- highlight-start -->
          <operations>
            <operation name="read" type="read">[...]
            <operation name="create" type="create">[...]
            <operation name="update" type="update">[...]
            <operation name="delete" type="delete">[...]
            <operation name="read list" type="readlist">[...]
          </operations>
<!-- highlight-end -->
        </object>
      </subobjects>
    </object>
  </objects>
</module>
```

However, the service is still defined on the aggregate root object, so the subobject's operations will be just added to the root service using fully qualified operation names, as follows.

```cs title="ISalesOrderService.cs"
public interface ISalesOrderService
{
    Task<Output<SalesOrder_ReadOutput>> ReadAsync([...]);
    Task<Output<SalesOrder_CreateOutput>> CreateAsync([...]);
    Task<Output> UpdateAsync([...]);
    Task<Output> DeleteAsync([...]);
    Task<Output<ICollection<SalesOrder_ReadListOutput>>> ReadListAsync([...]);

/* highlight-start */
    Task<Output<SalesOrderLineItem_ReadOutput>> LineItem_ReadAsync([...]);
    Task<Output<SalesOrderLineItem_CreateOutput>> LineItem_CreateAsync([...]);
    Task<Output> LineItem_UpdateAsync([...]);
    Task<Output> LineItem_DeleteAsync([...]);
    Task<Output<ICollection<SalesOrderLineItem_ReadListOutput>>> LineItem_ReadListAsync([...]);
/* highlight-end */
}
```

### Service configuration

You can define any additional configuration for the service in the `config` element of the root object, along with other configurations for that object.

For example, to configure customization parameters of the generated service implementation class, you can add an `svc:customize` config element, as follows.

```xml
<module xmlns="http://www.xomega.net/omodel"
        xmlns:svc="http://www.xomega.net/svc">
  <objects>
    <object name="sales order">
      <fields>[...]
      <operations>[...]
      <config>
        <sql:table name="Sales.SalesOrderHeader"/>
<!-- highlight-next-line -->
        <svc:customize extend="true" subclass="true" preserve-on-clean="true"/>
      </config>
    </object>
  </objects>
</module>
```

The `svc:customize` configuration allows you to specify the following generation options for the service.
- `extend` - whether to generate a partial service class, where you can add properties and methods that can be used in any custom code mixed into the generated service class.
- `subclass` - whether to generate and use a subclass of the generated service class, where you can provide your custom implementation for any of the generated service methods.
- `preserve-on-clean` - whether you want to preserve the generated service class and any custom code it contains whenever you run the *Clean* command.

### General services

Normally, for most of your service operations, you can find an appropriate domain object to add them to so that they'd be part of that domain service.

If you need to define service operations that don't belong to any of the domain objects, then you can declare an artificial object with no fields in the model and add the operations to that object, which would turn it into a general service without the underlying domain object.

:::note
Object with no fields will not be considered as a domain entity and will not have an associated database table.
:::

The following example illustrates a  simple general service `calculator` that has an `add` operation for two decimal values.

```xml
<object name="calculator">
  <operations>
    <operation name="add">
      <input>
        <param name="value1" type="decimal" required="true"/>
        <param name="value2" type="decimal" required="true"/>
      </input>
      <output>
        <param name="result" type="decimal" required="true"/>
      </output>
    </operation>
  </operations>
</object>
```

## API configuration

When you expose your services via a certain communication API, such as REST or WCF, you can provide technology-specific configurations for such APIs in your service model both for the entire service and for each individual operation, as described below.

### REST configuration

When you create REST API for your services, you need to configure each operation using a `rest:method` config element, where you can specify the `verb` and `uri-template` for the operation.

The URI template should include all individual input parameters of the operation in curly braces, either in the path or in the query string. However, for `POST`, `PUT`, or `PATCH` methods, you can have one parameter that is not part of the `uri-template`, which means that it will be passed in the body of the request.

:::danger
To allow using input parameters in the URI template, the input structure should have inline parameters rather than reference any structure and should not have an `arg` attribute. In other words, you normally **don't** want to model your REST operations using either `<input struct="another structure"/>` or  `<input arg="arg name">`.
:::

In the following example, the `update` operation on the `sales order` object is configured with a `PUT` method, and the `uri-template` contains the `sales order id` parameter in the path, while the `data` input structure will be passed in the request body.

```xml
<!-- highlight-next-line -->
<object name="sales order" xmlns:rest="http://www.xomega.net/rest">
  <fields>[...]
  <operations>
    <operation name="update">
      <input>
<!-- highlight-next-line -->
        <param name="sales order id"/>
        <struct name="data">[...]
      </input>
      <output>[...]
      <config>
<!-- highlight-next-line -->
        <rest:method verb="PUT" uri-template="sales-order/{sales order id}"/>
      </config>
    </operation>
  </operations>
</object>
```

If you don't supply a `rest:method` for any operations, then running a generator for REST controllers will output some warnings alerting you of any such operations in order to help you catch any mistakes in your model.

If you do need to have an internal service operation in your model, which should not be exposed via REST, you still need to add the `rest:method` config element and set the `not-supported="true"` attribute on it, as follows.

```xml
<object name="my object">
  <fields>[...]
  <operations>
    <operation name="internal operation">
      <config>
<!-- highlight-next-line -->
        <rest:method not-supported="true"/>
      </config>
    </operation>
  </operations>
</object>
```

:::warning
Since the operation not exposed via REST is still part of the service interface, it will be visible to the REST clients. However, calling it from the client will result in a runtime error.
:::

#### REST method customization

If you need to customize the code generated for your Web API controller method that exposes your operation over REST, then you can set the `customize="true"` attribute on the `rest:method` element, as follows.

```xml
<object name="error log">
  <fields>[...]
  <operations>
    <operation name="create" type="create">
      <input arg="data">[...]
      <output>[...]
      <config>
<!-- highlight-next-line -->
        <rest:method verb="POST" uri-template="error-log" customize="true"/>
      </config>
    </operation>
  </operations>
</object>
```

This will allow you to modify the generated method and set custom headers or other HTTP-specific parameters for your REST endpoint.
You can also check the generator docs for additional details on [customizing *Web API Controllers*](../../generators/services/web-api#customizing-the-output).


#### REST client customization

If you need to create and use a custom REST client class, then you can add `rest:client` element to the `config` node of the corresponding root object that defines your service and set the `customize="true"` attribute, as follows.

```xml
<module xmlns="http://www.xomega.net/omodel"
        xmlns:rest="http://www.xomega.net/rest">
  <objects>
    <object name="sales order">
      <fields>[...]
      <operations>[...]
      <config>
        <sql:table name="Sales.SalesOrderHeader"/>
<!-- highlight-next-line -->
        <rest:client customize="true"/>
      </config>
    </object>
  </objects>
</module>
```

Check the generator docs for further details on [customizing *REST Service Clients*](../../generators/presentation/common/rest-clients#customizing-the-output).

### WCF configuration

If you need to expose your services via the legacy WCF framework, then you need to add a [global WCF configuration](config/#wcf-config), and the [generator of the service interfaces](../../generators/services/contracts) will add the standard WCF `ServiceContract`, `OperationContract`, and `DataContract` attributes to the generated classes.

If you need to further customize the WCF attributes that are generated on a service method, then you can add them to the `config` elements of that operation under the `wcf:operation` element.

:::note
Each element will have the same name as the corresponding WCF attribute, and you can add multiple elements where multiple WCF attributes are allowed.

The attributes of each element will be the named properties of the WCF attribute, and any nested elements will correspond to the unnamed parameters of that WCF attribute.
:::

The following example demonstrates all WCF attributes that you can define for an operation, which should go in the order they are listed here.

```xml
<objects>
  <object name="sales order">
    <operations>
      <operation name="update" type="update">
        <input>[...]
        <config xmlns:wcf="http://www.xomega.net/wcf">
<!-- highlight-start -->
          <wcf:operation>
            <wcf:OperationContract ProtectionLevel="System.Net.Security.ProtectionLevel.EncryptAndSign"/>
            <wcf:OperationBehavior Impersonation="ImpersonationOption.Allowed"/>
            <wcf:TransactionFlow>
              <wcf:transactions>TransactionFlowOption.NotAllowed</wcf:transactions>
            </wcf:TransactionFlow>
            <wcf:FaultContract>
              <wcf:detailType>YourFaultType</wcf:detailType>
            </wcf:FaultContract>
            <wcf:ServiceKnownType>
              <wcf:type>YourServiceType</wcf:type>
            </wcf:ServiceKnownType>
            <wcf:ServiceKnownType>
              <wcf:methodName>"YourMethod"</wcf:methodName>
              <wcf:declaringType>YourDeclaringType</wcf:declaringType>
            </wcf:ServiceKnownType>
            <wcf:XmlSerializerFormat Style="OperationFormatStyle.Document"/>
          </wcf:operation>
<!-- highlight-end -->
        </config>
      </operation>
    </operations>
  </object>
</objects>
```

If you need to have an internal service operation in your model, which should not be exposed via WCF, you need to add the `wcf:operation` config element and set the `not-supported="true"` attribute on it, as follows.

```xml
<object name="my object">
  <fields>[...]
  <operations>
    <operation name="internal operation">
      <config>
<!-- highlight-next-line -->
        <wcf:operation not-supported="true"/>
      </config>
    </operation>
  </operations>
</object>
```

:::warning
Since the operation not exposed via WCF is still part of the service interface, it will be visible to the WCF clients. However, calling it from the client will result in a runtime error.
:::

Similar to the operations, you can configure specific WCF attributes for your entire service in the `config` element of your domain object, using the above-mentioned rules for elements and their attributes and nested elements, as follows.

```xml
<objects>
  <object name="sales order">
    <operations>[...]
    <config>
<!-- highlight-start -->
      <wcf:service>
        <wcf:ServiceContract SessionMode="SessionMode.Allowed"/>
        <wcf:ServiceKnownType>
          <wcf:type>YourServiceType</wcf:type>
        </wcf:ServiceKnownType>
        <wcf:ServiceKnownType>
          <wcf:methodName>"YourMethod"</wcf:methodName>
          <wcf:declaringType>YourDeclaringType</wcf:declaringType>
        </wcf:ServiceKnownType>
        <wcf:DeliveryRequirements RequireOrderedDelivery="true"/>
        <wcf:XmlSerializerFormat Use="OperationFormatUse.Encoded"/>
      </wcf:service>
<!-- highlight-end -->
    </config>
  </object>
</objects>
```


## Types of operations

The following sections describe some types of service operations for which Xomega provides some special handling.

### Read list with criteria

The `readlist` operation with criteria is one of the most common types of service operations, where you pass the user-supplied criteria as an input and get a list of objects with any related fields as the output.

The typical structure of such an operation in the Xomega model is where the input structure has an inline child structure `criteria`, which in turn contains the search field parameters, as well as an operator for each field, where appropriate.

If you want Xomega to generate most of the code on the service and UI layers that require minimum customization, then your `readlist` operation needs to adhere to the following naming conventions.

1. If a result or criteria parameter is for one of the object's fields, then you should use the name of the field for the name of that parameter. You can also omit the `type` attribute unless you want to override the field's type.
1. Criteria parameters are typically not required, so if it matches a required field, you may need to explicitly set the `required="false"` attribute on the parameter to override it.
1. If a search parameter applies to a specific output field, then they both should use the same name, even when there is no object field with that name.
1. The name of the operator parameter for each criterion should be a combination of the criteria parameter and the suffix " operator", e.g., `sales order number operator` for the `sales order number` criteria.
1. The type of the operator parameter should be `operator` or any subtype thereof.
1. For any criteria that support ranges for the `Is Between` operator, you need to add a second parameter with the same name plus a suffix "2", e.g., `order date2` for the `order date` criteria.

The following example demonstrates these criteria conventions.

```xml
<object name="sales order">
  <fields>[...]
  <operations>
    <operation name="read list" type="readlist">
      <input>
        <struct name="criteria">
          <!-- order number criteria that allows using an operator -->
<!-- highlight-start -->
          <param name="sales order number operator" type="operator">
          <param name="sales order number" required="false"/>
<!-- highlight-end -->
          
          <!-- status criteria that allows filtering by multiple statuses -->
<!-- highlight-next-line -->
          <param name="status" required="false" list="true"/>

          <!-- order date criteria with from/to range to support the Is Between operator -->
<!-- highlight-start -->
          <param name="order date operator" type="operator"/>
          <param name="order date" type="date" required="false"/>
          <param name="order date2" type="date" required="false"/>
<!-- highlight-end -->
        </struct>
      </input>
      <output list="true">[...]
    </operation>
  </operations>
</object>
```

The list of operators for each field in the generated app will be different based on the type of the underlying criteria, whether the criteria accepts multiple values or a single value, and whether there exists a second parameter for the ranges.

:::note
If you don't provide an operator parameter, then the service will assume the default `Is Equal To` operator or `Is Between` operator when a range is supplied or `Is One Of` operator when the parameter is multi-value.
:::

For example, if the criteria field is a string, the operators will be `Is Equal To`, `Starts With`, or `Contains` along with the corresponding `Does Not Start With` or `Does Not Contain`. For dates, it may be `Is Earlier Than`, `Is Later Than`, `Is Between`, etc., and for multi-value criteria, the operators may be `Is One Of` or `Is None Of`.

The standard set of operators comes from the static enumeration `operators` associated with the `operator` type. That enumeration is defined in the model, and you can adjust it as you see fit.

For specialized criteria, you can also define your own enumeration with custom operators and associate it with your own subtype of the `operator` type, which you will use for your criteria. For example, you can define predefined custom periods for date ranges, such as `This Week` or `Last 14 Days`, or custom price ranges, such as `$0 - $100`, `$100 - $500`, etc.

### Dynamic enumerations

Another special type of service operation is dynamic enumerations, which represent a `read enum` operation that has no input parameters and therefore returns all objects.

The returned list is expected to be rather limited in size, and the objects in that list are not changed often, which allows the entire list to be globally cached and used for selection, lookup, or validation throughout the application without having to read it every time.

To configure a dynamic enumeration, you need to add an `xfk:enum-cache` element to the operation's `config` element and specify the following attributes.
- `enum-name` - enumeration name that is globally unique in the model across all enumerations.
- `id-param` - output parameter that represents the ID of the returned object, which can be used for lookup.
- `desc-param` - output parameter that represents the description of the returned object, which can be used for display.
- `is-active-param` - boolean output parameter that indicates if the returned object is active, which can allow lookups but can prevent the selection of inactive objects.

:::note
If you need to display localized text to the user, then please check the section on [localizing dynamic enumerations](static-data#localizing-dynamic-items).
:::

In the following example, the `read enum` operation on the `sales person` object returns all salespersons and allows caching this enumeration under the name `sales person`.

```xml
<object name="sales person">
  <fields>[...]
  <operations>
<!-- highlight-next-line -->
    <operation name="read enum">
      <output list="true">
        <param name="business entity id"/>
        <param name="territory id"/>
        <param name="name" type="string"/>
        <param name="is-current" type="boolean" required="true"/>
      </output>
      <config xmlns:xfk="http://www.xomega.net/framework">
        <rest:method verb="GET" uri-template="sales-person"/>
<!-- highlight-start -->
        <xfk:enum-cache enum-name="sales person" id-param="business entity id"
                        desc-param="name" is-active-param="is-current"/>
<!-- highlight-end -->
      </config>
    </operation>
  </operations>
</object>
```

Once you configure an operation as a dynamic enumeration, you can [associate it with a logical type](types#dynamic-enumeration). The fields of that type will support selection, lookup, and validation from this enumeration.

:::tip
You can easily add such an operation to any object using a specially configured [Model CRUD generator](../../generators/model/crud#dynamic-enumeration).
:::

### Contextual enumerations

If the full result from a `read enum` operation would be too large to read and cache in its entirety, but you still want to be able to read and locally cache a subset of all such objects for a specific context in your application, then you can also configure it with the same `xfk:enum-cache` config element, but provide some input parameters that would need to be passed from the current context.

This will allow Xomega to generate the necessary cache loader classes for this operation, which you can leverage to set up contextual locally cached enumeration within your application. Xomega Framework makes it pretty straightforward for you.

In the following example, the list of business entity addresses would be too large to read and cache as a whole, so we used the `business entity id` as an input parameter.

```xml
<object name="business entity address">
  <fields>[...]
  <operations>
<!-- highlight-next-line -->
    <operation name="read enum">
      <input>
<!-- highlight-next-line -->
        <param name="business entity id" type="business entity" required="true"/>
      </input>
      <output list="true">
        <param name="address id" type="address" required="true"/>
        <param name="address type" type="name" required="true"/>
        <param name="address line1" type="address line"/>
        <param name="address line2" type="address line"/>
        <param name="city" type="city name"/>
        <param name="state" type="state province code"/>
        <param name="postal code" type="postal code"/>
        <param name="country" type="country region"/>
      </output>
      <config>
        <rest:method verb="GET" uri-template="business-entity/{business entity id}/address"/>
<!-- highlight-start -->
        <xfk:enum-cache enum-name="business entity address"
                        id-param="address id" desc-param="address type"/>
<!-- highlight-end -->
      </config>
    </operation>
  </operations>
</object>
```

When the user opens a screen that has a context of a specific business entity, we'll be able to read and cache the list of addresses for that entity for selection or lookups. If the business entity changes on the screen, then we will call it again with the new ID and will cache the new results.

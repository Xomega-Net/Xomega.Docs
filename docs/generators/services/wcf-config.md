---
sidebar_position: 3
sidebar_label: "WCF Server Configuration"
---

# WCF Configuration

This generator allows creating Windows Communication Foundation (WCF) server-side or client-side configuration files for all services that are generated from the object model.

It creates endpoints for each service contract based on the global configuration specified in the model. If the configuration file specified in the output path already exists then it will be updated to add the new endpoints as necessary, which makes the generator re-runnable.

## Generator inputs

The generator takes all services defined in the model as the input, which translates to any objects that have `operations` defined on them, or on their subobjects, as shown below.

```xml
<objects>
  <object name="sales order">
    <fields>...</fields>
<!-- highlight-next-line -->
    <operations>
      <operation name="read" type="read">[...]
      <operation name="create" type="create">[...]
      <operation name="update" type="update">[...]
      <operation name="delete" type="delete">[...]
      <operation name="read list" type="readlist">[...]
      <doc>
        <summary>A service for querying and managing Sales Order objects.</summary>
      </doc>
    </operations>
  </object>
</objects>
```

## Generator outputs

The generator adds endpoint configurations for each service to the specified client-side or server-side configuration file.

For server-side configuration, it adds the endpoints to configurations of the actual WCF services that it also generates.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|WCF Configuration|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Service Layer|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Wcf /serviceModel.services.config|Relative path to the config file to add WCF configurations to.|
|**Parameters**|
|Is Client|False|Specify whether to generate a client or a server configuration.|
|Endpoint Behavior||Endpoint behavior to set for all service endpoints.|
|Service Behavior||Service behavior to set for all services. Applicable only if *Is Client* is set to False.|

### Model configuration

Endpoint configuration parameters for the generator are specified in the Xomega model in the `wcf:endpoint-config` elements nested within the `wcf:config` node under the top level `config` element, which is conventionally placed in the `global_config.xom` file.

For each type of endpoint that you want to generate, you can specify the type of WCF binding, the name of the binding configuration to use, base local address, and a base remote address template, which may contain {Module/} and {File} placeholders, and should be consistent with the output path configuration for the [WCF Service Host Files](wcf-host) generator.

A separate `svc:services-config` element specifies the namespaces of the service contracts and their implementations. The following snippet illustrates such a configuration.

```xml title="global_config.xom"
<wcf:config xmlns:wcf="http://www.xomega.net/wcf">
<!-- highlight-start -->
  <wcf:endpoint-config binding="ws2007FederationHttpBinding"
                       bindingConfiguration="message"
                       baseLocalAddress=""
                       baseRemoteAddress="http://localhost:61436/{Module/}{File}.svc"/>
<!-- highlight-end -->
</wcf:config>
 
<svc:services-config async="true" xmlns:svc="http://www.xomega.net/svc"
<!-- highlight-start -->
                     namespace="MySolution.Services.Common"
                     implNamespace="MySolution.Services.Entities"/>
<!-- highlight-end -->
```

### Common configurations

Typically there expected to be one configuration of this generator for the server-side, which updates WCF configuration of the project for WCF services, and another configuration for the client-side, which adds endpoints to the WCF configuration of a client project, such as a WPF project.

:::note
If there are multiple clients using the same WCF services, then there may be several client-side configurations for each project.
:::

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only.

You can rerun the generator when you add new services to the system, which happens if you add operations to a model object that didn't have any operations, or when you change any endpoint or services configurations in the model. This is usually the case during initial active prototyping or development of the system.

:::tip
Therefore, this generator can be included in the build of the model project in its configuration initially, and then, once the list of services and WCF configuration are stable, can be excluded from the model build.
:::

### Customizing the output

You can update parameters for individual endpoints in the corresponding target config files, and they will be preserved during subsequent generator runs, if you don't change the endpoint names.

### Cleaning generator’s output

This generator does not support cleaning generated endpoints from the target config files, since they may have custom changes.

In order to clean the endpoints in case when a service is removed or configuration is changed, you have to manually remove or update the generated endpoint or service configurations accordingly.
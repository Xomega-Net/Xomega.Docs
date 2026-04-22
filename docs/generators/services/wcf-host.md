---
sidebar_position: 4
---

# WCF Service Host Files

This generator creates service host files (`.svc`) for hosting WCF services in IIS.

The generated service host files use a default service host factory from the `Xomega.Framework.Wcf` package, which allows using dependency injection to instantiate and manage the WCF services.

## Generator inputs

The generator takes all services defined in the model as the input, which translates to any objects that have `operations` defined on them, or on their subobjects, as shown below.

```xml
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
      <doc>
        <summary>A service for querying and managing Sales Order objects.</summary>
      </doc>
    </operations>
  </object>
</objects>
```

## Generator outputs

The generator outputs `.svc` files for each service, possibly grouped by module, as specified by the `Path` parameter in the `wcfSvcHost:Output` element.

## Configuration

By default, the generator configuration is defined under the `.Generators\Service Layer` folder in the model project as follows.

```xml title="WCF Service Host Files.xgen"
<XomGeneratorConfig xmlns="http://schemas.xomega.net/v10/xgen"
                    xmlns:wcfSvcHost="http://schemas.xomega.net/v10/xgen/wcf-host">

  <Generator Xsl="Services/WCF/svc_host_files.xsl"
             IncludeInBuild="true"/>

  <wcfSvcHost:Output Path="../MySolution.Services.Wcf/{Module/}{File}.svc"
                     TargetProject="../MySolution.Services.Wcf/MySolution.Services.Wcf.csproj"/>

</XomGeneratorConfig>
```

### Generator parameters

The following table describes configuration parameters for the generator.

|Parameter|Value Example|Description|
|-|-|-|
|Xsl|Services/WCF/svc_host_files.xsl|Relative path to the XSLT file used by the generator to generate the WCF service host files.|
|IncludeInBuild|true|A flag indicating whether or not running this generator should be included in building of the model project.|
|**wcfSvcHost:Output**|
|Path|../MySolution.Services.Wcf /\{Module/\}\{File\}.svc|Relative path where to output generated IIS service host files. The path must contain a \{File\} placeholder to output files by service, and may contain a \{Module/\} placeholder to also group the services by module.|
|TargetProject|../MySolution.Services.Wcf /MySolution.Services.Wcf.csproj|Relative path to the project file to add the generated files to. The project will be reloaded every time you run the generator. Leave it blank if you don't want generated files to be added to your project automatically.|

### Model configuration

The generator itself doesn't use any configuration from the model, but the `baseRemoteAddress` on the endpoint configurations, which is used by the [WCF Configuration](wcf-config) generator, should be consistent with the `Path` parameter of the current generator, as illustrated below.

```xml title="global_config.xom"
<wcf:config xmlns:wcf="http://www.xomega.net/wcf">
  <wcf:endpoint-config binding="ws2007FederationHttpBinding"
                       bindingConfiguration="message"
                       baseLocalAddress=""
<!-- highlight-next-line -->
                       baseRemoteAddress="http://localhost:61436/\{Module/\}\{File\}.svc"/>
</wcf:config>
```

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator for the entire model only.

You can rerun the generator when you add new services to the system, which happens if you add operations to a model object that didn't have any operations. This is usually the case during the initial active prototyping or development of the system.

:::tip
Therefore, this generator can be included in the build of the model project in its configuration initially, and then, once the list of services is stable, can be excluded from the model build.
:::

### Customizing the output

The generator doesn't support any additional customization beyond what can be specified in the generator's parameters.

### Cleaning the generator’s output

This generator does not support cleaning generated service host files.

You have to manually remove any generated `.svc` files if you change the `Path` parameter in the `wcfSvcHost:Output` element or remove any services in the model.
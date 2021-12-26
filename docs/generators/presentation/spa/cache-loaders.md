---
sidebar_position: 4
---

# TS Lookup Cache Loaders

Generates XomegaJS based classes for contextual loading of lookup tables from a database using a service operation. The lookup cache is then used to populate selection lists and to decode values, if the list is relatively static.

The service operations for contextual cache loaders take input parameters, so the generated cache loaders classes extend the base `LocalCacheLoader` class, and you should make sure the values of the input parameters get set from the context that they are used in, which can be handled automatically by the `EnumProperty`.

## Generator inputs

To generate cache loaders, the generator uses contextual `read list` REST operations in the model that have input parameters, as well as a valid `rest:method` and `xfk:enum-cache` elements nested inside their `config` element.

It should also specify `id-param` and `desc-param` attributes that indicate which output parameters of the `read list` operation return the ID and Description of the record respectively.

The ID is what is stored internally in the system when you select an item from that list, and also what you typically look up the record by. The Description is what is displayed to the user on the screen instead of (or in combination with) the ID.

Any other output parameters will be stored as additional named attributes of the cached record.

### Contextual Loaders

The following example shows a `special offer product` cache loader, which loads all special offers for a specific product.

```xml
<object name="special offer product">
  <operations>
    <operation name="read list" type="readlist">
      <input>
<!-- highlight-next-line -->
        <param name="product id" type="product" required="true"/>
      </input>
      <output list="true">
        <param name="special offer id" type="special offer" required="true"/>
        <param name="description" type="string"/>
        <param name="discount" type="percent"/>
        <param name="active" type="boolean"/>
      </output>
      <config>
<!-- highlight-next-line -->
        <xfk:enum-cache enum-name="special offer product" id-param="special offer id"
                        desc-param="description" is-active-param="active"/>
<!-- highlight-next-line -->
        <rest:method verb="GET" uri-template="product/{product id}/special offer"/>
      </config>
    </operation>
  </operations>
</object>
```

The generated class will extend the `LocalCacheLoader` base class from XomegaJS framework, and you will need to make sure that the input parameters for the `readlist` operation are set for the current context before the cache is loaded.

You can either
- manually subscribe to the changes of the input parameters, and then call the `setParameters` method of the generated cache loader directly with the new values,
- or you can set that cache loader on the `EnumProperty`, for which it will serve as a local source of possible values, and then set the source property for each input parameter, as follows.

```ts
this.SpecialOfferId.LocalCacheLoader = new SpecialOfferProductReadListCacheLoader();
this.SpecialOfferId.setCacheLoaderParameters(SpecialOfferProduct.Parameters.ProductId, this.ProductId);
```

This will automatically listen for changes in the `ProductIdProperty`, and will reload the local cache loader for the `SpecialOfferIdProperty` whenever the product ID changes, which will in turn update the list of possible values for the special offer selection.

### Static Loaders

For `read list` operations that have no input parameters, and return static data that can be loaded into the lookup cache globally, the cache loaders are generated in C# by a separate generator for Xomega Framework to load them into the lookup cache on the server side.

The lookup tables are then exposed via a standard REST endpoint, which XomegaJS framework uses to load the static data to the client. Therefore, there is no need to generate static TypeScript cache loaders for such operations.

## Generator outputs

This generator creates TypeScript classes for XomegaJS-based local cache loaders that call the specified operation and construct lookup tables from the results, with ID and description of each record according to the configuration, and all other result parameters stored in additional attributes.

:::caution
The client needs to make sure its method `setParameters` is called with the contextual values to populate the local cache as appropriate.
:::

The generator also adds the generated classes to the specified project as needed.

## Configuration

The following sections describe configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|TS Lookup Cache Loaders|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Presentation Layer\SPA|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Spa /CacheLoaders/{File}.ts|Relative path where to output files with generated Lookup Cache Loaders. The path may contain {Module/} and {File} placeholders to output files by module and data object respectively.|
|Add To Project|../MySolution.Services.Spa /MySolution.Services.Spa.csproj|Relative path to the project file to add the generated files to. The project will be reloaded every time you run the generator. Leave it blank if you don't want generated files to be added to your project automatically.|

### Model configuration

Parameters specified in the model configuration that are used by this generator consist of the output path for the TypeScript service contracts. This is specified in the `svc:services-config` element under the top level `config` model element, which is conventionally placed in the `global_config.xom` file, as follows.

```xml title="global_config.xom"
<svc:services-config tsOutputPath="../MySolution.Client.Spa/ServiceContracts/{Module/}{File}"/>
```

### Common configurations

There expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator either for the entire model, or for individual files by selecting them in the model project, and running the generator from the context menu.

You can rerun the generator when you add or change the contextual `xfk:enum-cache` configuration of `read list` operations, or if you change any parameters on those operations. Normally, the latter will require re-running other generators that depend on the same model elements, such as generators of UI views, data objects, service and data contracts or the service implementations.

:::note
Therefore, this generator should be included in the build of the model project in the configuration, in order to allow to easily regenerate all cache loaders along with other artifacts.
:::

### Customizing the output

:::danger
You should never edit generated cache loaders directly. This allows re-running the generator at any time without losing your customizations.
:::

To add your customizations, you should create a subclass of the generated cache loader class, and use the subclass in your code.

### Cleaning generator’s output

This generator supports cleaning either all generated cache loaders, or only the ones from the selected model files using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the enumerations from the model, and want the generated classes deleted and removed from the target project.
:::
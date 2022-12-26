---
sidebar_position: 1
---

# Lookup Cache Loaders

Generates Xomega Framework-based classes for loading a lookup cache from a database using a service operation, and registers them with the dependency injection (DI) container. A global lookup cache is used to populate selection lists and to decode values if the list is relatively static.

If the service operation for a cache loader takes some parameters, then the generated cache loader class will extend the base `LocalCacheLoader` class, and will not be registered with the DI container. You will need to manually create such local cache loaders for each context, and make sure the values of the input parameters get set from that context, which can also be handled automatically by the `EnumProperty`.

## Generator inputs

To generate cache loaders, the generator uses `read enum` operations in the model that have `xfk:enum-cache` element nested inside their `config` element. This element must have an attribute `enum-name` set, with a name that is unique across all enumerations defined in the model.

It should also specify `id-param` and `desc-param` attributes that indicate which output parameters of the `read enum` operation return the ID and Description of the record respectively. The ID is what is stored internally in the system when you select an item from that list, and also what you typically look up the record by. The Description is what is displayed to the user on the screen instead of (or in combination with) the ID.

Any other output parameters will be stored as additional named attributes of the cached record.

### Static Loaders

When the operation has no input parameters, the generated class is used to load all items into the cache when the specified enumeration is needed. It will also be registered with the DI service container.

The following example shows a configuration of the cache loader that reads a list of all sales territories.

```xml
<object name="sales territory">
  <operations>
    <operation name="read enum">
      <output list="true">
        <param name="territory id"/>
        <param name="name"/>
        <param name="country region code"/>
        <param name="group"/>
      </output>
      <config>
<!-- highlight-next-line -->
        <xfk:enum-cache enum-name="sales territory" id-param="territory id" desc-param="name"
                        xmlns:xfk="http://www.xomega.net/framework"/>
      </config>
    </operation>
  </operations>
</object>
```

### Contextual Loaders

If the `read enum` operation of the cache loader takes any input parameters, then the list of values for the cache will depend on the value(s) of the input parameters in each particular context.

The following example shows a `special offer product` cache loader, which loads all special offers for a specific product.

```xml
<object name="special offer product">
  <operations>
    <operation name="read enum">
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
<!-- highlight-start -->
        <xfk:enum-cache enum-name="special offer product" id-param="special offer id"
                        desc-param="description" is-active-param="active"/>
<!-- highlight-end -->
      </config>
    </operation>
  </operations>
</object>
```

The generated class will extend the `LocalCacheLoader` base class from Xomega Framework, and you will need to make sure that the input parameters for the `read enum` operation are set for the current context before the cache is loaded.

You can either
- manually subscribe to the changes of the input parameters, and then call the `SetParameters` method of the generated cache loader directly with the new values,
- or you can set that cache loader on the `EnumProperty`, for which it will serve as a local source of possible values, and then set the source property for each input parameter, as follows.

```ts
SpecialOfferIdProperty.LocalCacheLoader = new SpecialOfferProductReadListCacheLoader(ServiceProvider);
// highlight-start
SpecialOfferIdProperty.SetCacheLoaderParameters(Enumerations.SpecialOfferProduct.Parameters.ProductId,
                                                ProductIdProperty);
// highlight-end
```

This will automatically listen for changes in the `ProductIdProperty` and will reload the local cache loader for the `SpecialOfferIdProperty` whenever the product ID changes, which will in turn update the list of possible values for the special offer selection.

:::note
Note, that the setup of such enumeration configuration for a "readlist" operation can be easily added automatically to the model by a special [model enhancement CRUD generator](../model/crud).
:::

### Generator outputs

This generator creates C# classes for Xomega Framework-based cache loaders that call the specified operation and construct lookup tables from the results, with ID and description of each record according to the configuration, and all other result parameters stored in additional attributes.

If the operation takes any input parameters, the client needs to make sure its method `SetParameters` is called with the contextual values to populate the local cache as appropriate.

For cache loaders that don't have input parameters, and are not configured to skip registration, the generator creates a static class for registering them for dependency injection with the service container.

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|Lookup Cache Loaders|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Static Data|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|True|A flag indicating whether or not running this generator should be included in building of the model project.|
|**Output**|
|Output Path|../MySolution.Services.Common /CacheLoaders/{Module/}{File}.cs|Relative path where to output files with generated Lookup Cache Loaders. The path may contain {Module/} and {File} placeholders to output files by module and data object respectively.|
|Registry File|../MySolution.Services.Common /CacheLoaders/LookupCacheLoaders.cs|Relative path to the file for registration or cache loaders with the DI service container. The registration extension method will be derived from the file name.|
|**Parameters**|
|Namespace||Namespace for the generated classes. If not set, the namespace for service contracts will be used.|

### Model configuration

The parameters specified in the model configuration that is used by this generator consist of just the namespace for the service contracts, in the case when the *Namespace* generator parameter is not set.

This is specified in the `svc:services-config` element under the top-level `config` model element, which is conventionally placed in the `global_config.xom` file, as illustrated by the following snippet.

```xml title="global_config.xom"
<svc:services-config namespace="MySolution.Services" />
```

### Common configurations

There is expected to be just one configuration of this generator in the model, with the parameter values as illustrated above.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

You can run this generator either for the entire model or for individual files by selecting them in the model project and running the generator from the context menu.

You can rerun the generator when you add or change the `xfk:enum-cache` configuration of `read enum` operations, or if you change any parameters on those operations. Normally, the latter will require re-running other generators that depend on the same model elements, such as generators of UI views, data objects, service and data contracts, or service implementations.

:::note
Therefore, this generator should be included in the build of the model project in the configuration, to allow for easy regeneration of all cache loaders along with other artifacts.
:::

### Customizing the output

:::danger
You should never edit generated cache loaders or registration classes directly. This allows re-running the generator at any time without losing your customizations.
:::

To add your customizations, you should create a subclass of the generated cache loader class, and, for static cache loaders, register that subclass with the dependency injection service container after the generated cache loaders are registered.

### Cleaning the generator’s output

This generator supports cleaning either all generated cache loaders or only the ones from the selected model files using the *Clean* context menu for that generator.

:::tip
Normally, cleaning the generated files makes sense if you are planning to change the output path for the generator, or when you have removed some of the enumerations from the model, and want the generated classes deleted and removed from the target project.
:::

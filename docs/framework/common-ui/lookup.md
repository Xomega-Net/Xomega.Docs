---
sidebar_position: 2
---

# Lookup Data

Most business applications have some enumerated data that is used to populate selection items, as well as to look up the item by ID during validation or for any other purposes. Also, this data is typically fairly static, which lends itself to caching it globally, or at least for the current work session, so as to avoid unnecessary trips to the database or returning the full data for each result row versus just an ID.

For example, suppose that you have an `Order Status` field that can be one of the predefined code values for each status, e.g. *N* for *New*, *C* for *Complete*, etc. When you have a screen for searching orders, the filter field for the status should provide a selection of statuses that shows status descriptions, but store the internal status codes, so you need a way to get a list of statuses with both codes and descriptions.

The backend service will need to validate that each provided status code is one of the valid statuses, especially when the service is called via a remote API, e.g. REST, where you don't want to rely on the UI validations alone. So it will need a way to quickly check if the provided status code is valid.

Similarly, when you display the order status in the results grid, you may want to show the full status description, whereas the backend service would return only the status code to make the result structure more simple and compact. In this case, the UI will need a way to quickly look up the status with its description by the status code, without making external calls.

Xomega Framework defines a flexible common structure for storing, loading and caching the lookup data on the client or on the server side, as described in the following sections.

## Headers

When you want to display a list of entities in a selection control, you typically don't need all the fields for each entity. Normally you need an internal ID, display text and possibly a few other attributes, which constitute the key information about the entity. For such information, Xomega Framework defines a generic class `Header` that represents the key header data for an entity.

The `Header` class has the following primary attributes.
- `Type` - a string that determines the class of objects it represents.
- `Id` - **string-based ID** that should be unique for all headers of the given type.
- `Text` - a user-friendly text that identifies this header.

### Invalid headers

Normally, headers are constructed with all three of the above parameters. However, when you have an invalid `Id` that was entered by the user or received from somewhere, then it's possible to construct a `Header` from just the type and that `Id`, which will mark it as invalid, by setting the `IsValid` flag to `false`, as illustrated below.

```cs
Header h = new Header("type", "Valid ID", "Display Text"); // h.IsValid is true.
/* highlight-next-line */
h = new Header("type", "Invalid ID"); // h.IsValid is false.
```

This allows you to store an invalid entered ID as a `Header` in data properties, which makes it easier to work with, when all the property values are of the same type.

### Inactive headers

As your system is used and evolves with time, some of its entities may get retired and should no longer be used, but they may not be physically deleted to maintain integrity of the other entities that use them. For example, when users are deactivated, they should no longer appear in the selection controls for new entities, but you still want to display their full name on the older entities that use them.

In order to support this, the `Header` class also has an `IsActive` flag, which is set to `true` by default for valid headers, but you can manually set it to `false` for inactive values. Inactive headers will not be available for selection, but you can still look them up by ID as needed.

### Additional attributes

In addition to the basic `Id` and `Text`, a `Header` can have any number of named attributes that are stored as an `object`. You can get or set them using the header's indexer, as follows.

```cs
Header hdr = new Header("type", "ID", "Display Text");
// highlight-start
hdr["my attribute"] = 4;
object attr = hdr["my attribute"]; // 4
// highlight-end
```

You can also store multiple values in the attribute using `List<object>`. To add a value to an attribute, you can use the `AddToAttribute` method, which will either set the initial scalar value for the attribute, or add the value to the existing list, if it's not a duplicate (it will construct a new list, if the current value is not an `IList`), as illustrated below.

```cs
Header hdr = new Header("type", "ID", "Display Text");
// highlight-start
hdr.AddToAttribute("attr", "a"); // hdr["attr"] -> "a"
hdr.AddToAttribute("attr", "b"); // hdr["attr"] -> List<object>() { "a", "b" }
hdr.AddToAttribute("attr", "a"); // duplicate, hdr["attr"] -> List<object>() { "a", "b" }
// highlight-end
```

### Display format

Headers provide a flexible way to create its display string representation by calling the `ToString(format)` method and passing it the desired format, which may contain placeholders for the `Id`, `Text` or any of its additional attributes.

The placeholders for the `Id` and `Text` fields are defined by the `Header`'s static constants `FieldId` and `FieldText` respectively. To get a placeholder for any additional attribute you can call `string.Format(Header.AttrPattern, "<attr>")` with the attribute name.

In the following example we create a header for the `New` status, and store some translations in the `lang-*` attributes, which we can use to format the display string for the header.

```cs
/* highlight-next-line */
Header hdr = new Header("status", "N", "New");
hdr["lang-de"] = "Neu"
hdr["lang-es"] = "Nuevo"

/* highlight-next-line */
string format = $"{Header.FieldId} - {Header.FieldText}"; // "[i] - [t]"
string s = hdr.ToString(format); // "N - New"

/* highlight-next-line */
format = $"{Header.FieldId} ({string.Format(Header.AttrPattern, "lang-es")})"; // "[i] ([a:lang-es])"
s = hdr.ToString(format); // "N (Nuevo)"
```

The regular parameterless `ToString()` method of the `Header` uses its `DefaultFormat`, which you can set to make it return the data in your custom format. By default, the `DefaultFormat` is set to `Header.FieldText`, which displays the text of the header as a string.

### Dynamic object

The `Header` class extends from `DynamicObject`, which allows you to get or set its additional properties as regular members, as shown in the following code snippet.

```cs
Header hdr = new Header("status", "N", "New");
hdr["IsNew"] = true;

dynamic status = hdr;
// highlight-start
bool b = status.IsNew; // true
status.IsCompleted = false; // hdr["IsCompleted"] -> false;
// highlight-end
```

:::caution
Obviously, the names of the additional attributes must be **valid identifiers** in order to use them as member properties on a dynamic object. Also, these names are **case-sensitive**.
:::

## Lookup table

Xomega Framework provides a class `LookupTable` that represents a collection of headers of the same type, which allows looking them up by `Id` or any combination of attributes. These lookup tables are **self-indexing**, meaning that the lookups by the same attribute(s) are extremely **efficient and thread-safe**.

You can construct a `LookupTable` using the following parameters.
- `type` - the type of the headers in the lookup tables as a string.
- `data` - the list of `Header` objects of the specified type that serves as the table's data set.
- `caseSensitive` - a boolean flag of whether or not to perform case sensitive look-ups.

The following code snippet illustrates construction of a lookup table.

```cs
var data = new List<Header> {
  new Header("status", "O", "Open"),
  new Header("status", "P", "In Progress"),
  new Header("status", "C", "Completed"),
};
/* highlight-next-line */
var statusTable = new LookupTable("status", data, true);
```

:::note
If a type of any header in the provided data set is different from the type of the lookup table, it will be updated to be the latter.
:::

### Getting enum data

In order to get enumerated list of values from a lookup table, such as for displaying them in selection lists, you can call the `GetValues()` method. By default it returns all headers in the lookup table, but you can pass it a filter function that returns a `bool` for a specific header (and `DataRow`, where applicable) to get a subset of all values, as follows.

```cs
IEnumerable<Header> statuses = statusTable.GetValues(); // get a copy of all values
/* highlight-next-line */
statuses = statusTable.GetValues((hdr, row) => hdr.IsActive, null); // get a copy of filtered values
```

:::caution
Since lookup tables are often cached globally, it **returns copies** of the stored headers here to prevent the calling code from accidentally changing any of their attributes for everybody.

Therefore, if you need a filtered list, you should pass the filter function to the `GetValues` method instead of filtering the result afterwards. This will minimize the amount of cloning for each header, which should make your code more performant.
:::

### Looking up data

The most common use case for the lookup tables is to look up a header by its string `Id`, which you can do by calling the `LookupById` method. However, you can also look it up by any [display format](#display-format) that produces a unique string for the headers using the `LookupByFormat` method.

For example, to look it up by the text you can use the `Header.FieldText` format. You can also use any combination of `Id`, `Text` or additional attributes, as illustrated below.

```cs
// look up status by Id
var h = statusTable.LookupById("P"); // In Progress

// look up status by text
h = statusTable.LookupByFormat(Header.FieldText, "Completed");

// look up status by a combination of attributes
string format = $"{Header.FieldId} - {Header.FieldText}";
h = statusTable.LookupByFormat(format, "O - Open");
```

If you look up by a value of an additional attribute, which is not unique for all headers in the lookup table, then you will get just the first header that matches this attribute value. However, you can access other matching headers from a special attribute of the first header, which is `LookupTable.GroupAttrPrefix + format`, where `format` is the format for that attribute, as shown below.

```cs
var data = new List<Header> {
  new Header("status", "O", "Open"),
  new Header("status", "P", "In Progress"),
  new Header("status", "C", "Completed"),
};
// highlight-start
data[0]["closed"] = "no"; // Open
data[1]["closed"] = "no"; // In Progress
data[2]["closed"] = "yes"; // Completed
// highlight-end
var statusTable = new LookupTable("status", data, true);

string fmt = string.Format(Header.AttrPattern, "closed");
var open = statusTable.LookupByFormat(fmt, "no"); // Open
/* highlight-next-line */
var otherNonClosed = open[LookupTable.GroupAttrPrefix + fmt]; // In Progress
```

### Managing indexes

The first time you look up a header in a lookup table by any format (including by `Id`), it will build an index by that format, which it will use for any subsequent lookups. This self-indexing makes such lookups very flexible and efficient.

A small downside of self-indexing is increased memory footprint, especially when you need to look up data by a variety of formats. If you need to look up by a one-off format that you are not planning to reuse later, then you can call the `ClearIndex` method after the lookup, in order to reduce the amount memory that the lookup table takes, as follows.

```cs
statusTable.ClearIndex(Header.FieldText); // clear index by text

statusTable.ResetIndexes(); // clear all indexes
```

As you can see above, you can also call the `ResetIndexes` to clear all indexes, which will be subsequently rebuilt when you start looking up data by specific formats.

:::tip
You should always call the `ResetIndexes` if you change the value of the `CaseSensitive` flag, in order to rebuild the indexes.
:::

## Lookup cache

While a lookup table represents a collection of headers of the same type, the `LookupCache` class is a collection of lookup tables of various types, which loads lookup tables from their respective data stores using [lookup cache loaders](#lookup-cache-loaders) as needed, and provides access to those lookup tables by their types.

### Getting a lookup cache

Each lookup cache has a string-based `CacheType`, which determines how the cache is stored. Xomega Framework defines the following constants for cache types, but you can also define your own.

- `LookupCache.Global` - represents a global lookup cache that is shared for the whole application. This is typically used by default for common static lookup data.
- `LookupCache.User` - represents a lookup cache for the current user session. This is only available in multi-user environments where sessions are supported, e.g. in *WebForms*, and is used for lookup data that is specific to the current user due to security requirements or user preferences.
- `LookupCache.Local` - represents a local lookup cache for the current data property or context. Such a cache can be constructed manually, or implicitly by a `LocalLookupCacheLoader` class.

To get an instance of a lookup cache of the specified type, you can call a static method `LookupCache.Get`, which takes the current service provider and the type of cache, as follows.

```cs
LookupCache globalCache = LookupCache.Get(serviceProvider, LookupCache.Global);
```

### Lookup cache providers

The `LookupCache.Get` method delegates retrieval of the specified cache to the current `ILookupCacheProvider` that is registered with the `serviceProvider`. If no lookup cache provider is registered there, then it will use the `DefaultLookupCacheProvider` class that creates and returns a single instance of the lookup cache regardless of the specified cache type.

You can register an appropriate lookup cache provider for your app in your `Startup` class either directly or by using extension methods, as illustrated below.

```cs
// register a global DefaultLookupCacheProvider
services.AddSingletonLookupCacheProvider();

// register a WebLookupCacheProvider for WebForms projects
services.AddWebLookupCacheProvider();

// register a custom implementation of the ILookupCacheProvider
services.AddSingleton<ILookupCacheProvider, MyLookupCacheProvider>();
```

:::tip
You can implement and register a custom lookup cache provider, which can retrieve the lookup cache from your specific place, such as from a **distributed cache**.
:::

### Local lookup cache

When the lookup cache is limited to the current local context, you can manually construct a local cache from the current service provider and your custom [cache loaders](#lookup-cache-loaders), as follows.

```cs
var cacheLoaders = new List<ILookupCacheLoader>() { myCacheLoader };
/* highlight-next-line */
var localCache = new LookupCache(serviceProvider, cacheLoaders, LookupCache.Local);
```

:::tip
You can pass `null` as a list of cache loaders to the `LookupCache` constructor, which will make it use the list of cache loaders that are registered with the service provider.
:::

Alternatively, you can implement and instantiate your own subclass of the `LocalLookupCacheLoader`, and then access its `Cache` member, which will be loaded by that cache loader, as follows.

```cs
var localCacheLoader = new MyLocalLookupCacheLoader(serviceProvider, caseSensitive, "myTableType");
/* highlight-next-line */
var localCache = localCacheLoader.Cache;
```

### Accessing lookup tables

Once you have a lookup cache, you can get a `LookupTable` of a specific type from it by calling its async method `GetLookupTableAsync`, as follows.

```cs
LookupTable statusTable = await globalCache.GetLookupTableAsync("status", cancellationToken);
```

If the lookup table is not loaded into the cache yet, it will try to load it first using its lookup cache loader(s) that support loading that type. If none of the cache loaders were able to load the table of that type then you will get a `null` back from that method.

:::caution
Since loading the lookup cache happens asynchronously, and may require remote calls, you should **always use the async method** to get the lookup table, where possible.
:::

The `LookupCache` class also provides a synchronous method `GetLookupTable`. It will work the same way if the table is already loaded, but if it's not, then it will block the current thread while trying to load that lookup table. This **may cause threading issues**, including deadlocks. To avoid loading the lookup table when it's not in the cache, you can pass the `cacheOnly` argument as `true`, as follows.

```cs
LookupTable statusTable = globalCache.GetLookupTable("status", true); // don't load, if not in cache
```

If the cached data for a lookup table has changed, and you want to refresh it in the lookup cache, then you can call the `RemoveLookupTable`, and that lookup table will be reloaded next time you try to access it, as shown below.

```cs
globalCache.RemoveLookupTable("status"); // clear cached lookup table to be reloaded next time
```

## Lookup cache loaders

The `LookupCache` loads its lookup tables using a number of lookup cache loader classes that implement the `ILookupCacheLoader` interface. Each lookup cache loader is able to load lookup tables of one or more types.

You can pass a specific list of cache loaders to the constructor of the `LookupCache`, or you can pass `null` and it will use the cache loaders that you registered with the service provider in your `Startup` class. You can use an extension method for brevity, as follows.

```cs title="Startup.cs"
public void ConfigureServices(IServiceCollection services)
{
/* highlight-next-line */
    services.AddLookupCacheLoaders();
    ...
}
```

We recommend that you define your extension method in a separate class, where you would register all the cache loaders for the project as singletons, as follows.

```cs
public static void AddLookupCacheLoaders(this IServiceCollection container)
{
// highlight-start
    container.AddSingleton<ILookupCacheLoader, ProductCacheLoader>();
    container.AddSingleton<ILookupCacheLoader, SalesPersonCacheLoader>();
// highlight-end
    ...
}
```

You can manually implement the `ILookupCacheLoader` interface, where you'd need to implement the `IsSupported(cacheType, tableType)` method that indicates whether it can load the specified type of table for the specific cache type, as well as the actual async method `LoadAsync(cache, tableType)` that loads the table into the cache using `cache.CacheLookupTable(table)`.

However, Xomega Framework provides some base classes like `LookupCacheLoader` or `LocalLookupCacheLoader` that you can extend and just override the `LoadCacheAsync` method, as you will see below.

### Load table from service

If you have a specific list of objects that is fairly static and not too large, which you want to load into a lookup cache, and if you have a service operation that returns the entire list, then you can create and register a cache loader class that extends from the `LookupCacheLoader` and loads those objects into your cache using that service operation.

For example, if you want to cache a list of products that is returned by the `IProductService.ReadListAsync` operation, then you can define a `ProductCacheLoader` class, as follows.

```cs title="ProductCacheLoader.cs"
/* highlight-next-line */
public partial class ProductCacheLoader : LookupCacheLoader 
{
    public ProductCacheLoader(IServiceProvider serviceProvider)
/* highlight-next-line */
        : base(serviceProvider, LookupCache.Global, true, "product")
    {
    }
    ...
}
```

:::note
You construct the base class with a specific cache type, a case sensitive flag, and one or more supported lookup table types.
:::

Next, you need to override the `LoadCacheAsync` method to call your service operation, construct a `LookupTable` from the results, and update the cache with it, as illustrated below.

```cs
protected override async Task LoadCacheAsync(string tableType, CacheUpdater updateCache,
                                             CancellationToken token = default)
{
    // call remote services to read a list of products asynchronously
/* highlight-next-line */
    var output = await ReadProductsAsync(token);
    if (output?.Messages != null)
        output.Messages.AbortIfHasErrors();
    else if (output?.Result == null) return; // load next time or by another loader

    // build data for the lookup table
    var data = new Dictionary<string, Header>();
    foreach (var row in output.Result)
    {
        string id = "" + row.ProductId;
        if (!data.TryGetValue(id, out Header h))
        {
/* highlight-next-line */
            data[id] = h = new Header(tableType, id, row.Name);
            h.IsActive = IsActive(row.IsActive);
        }
        h.AddToAttribute("product model id", row.ProductModelId);
        h.AddToAttribute("list price", row.ListPrice);
    }

    // update cache even if no data is returned to mark it as loaded
/* highlight-next-line */
    updateCache(new LookupTable(tableType, data.Values, caseSensitive));
}
```

The `ReadProductsAsync` method that calls the remote service operation would look as follows.

```cs
protected async Task<Output<ICollection<Product>>> ReadProductsAsync(CancellationToken token = default)
{
    using (var s = serviceProvider.CreateScope())
    {
        var svc = s.ServiceProvider.GetService<IProductService>();
/* highlight-next-line */
        return await svc.ReadListAsync();
    }
}
```


### Parameterized loaders

When the list of objects is too large to be read and cached globally, you can define a service operation that takes some contextual parameters and returns the relevant subset of those objects, which you can then cache locally for the current context.

To set up such a local cache you can define a cache loader that extends from the `LocalLookupCacheLoader`, which maintains a dictionary of named `Parameters` with their values for your service call.

For example, if you have a large table of addresses for various business entities, and you want to load a local cache of addresses for a specific business entity, then you can define a `BusinessEntityAddressCacheLoader` as follows.

```cs
/* highlight-next-line */
public partial class BusinessEntityAddressCacheLoader : LocalLookupCacheLoader 
{
    public BusinessEntityAddressCacheLoader(IServiceProvider serviceProvider)
        : base(serviceProvider, true, "business entity address")
    {
    }

/* highlight-next-line */
    protected async Task<Output<ICollection<BusinessEntityAddress>>> ReadAddressListAsync(
        CancellationToken token = default)
    {
        using (var s = serviceProvider.CreateScope())
        {
// highlight-start
            if (Parameters.TryGetValue("business entity id", out businessEntityId))
            {
                var svc = s.ServiceProvider.GetService<IBusinessEntityAddressService>();
                return await svc.ReadListAsync((int)businessEntityId);

            }
// highlight-end
            return null;
        }
    }

    protected override async Task LoadCacheAsync(string tableType, CacheUpdater updateCache,
                                                 CancellationToken token = default)
    {
/* highlight-next-line */
        var output = await ReadAddressListAsync(token);
        ...
    }
}
```

Now you can construct a local cache loader for business entity addresses, set its parameters with a specific business entity ID, and get a cached lookup table of addresses from that local cache, as shown below.

```cs
var cacheLoader = new BusinessEntityAddressCacheLoader(serviceProvider);

// load local cache for the business entity with Id 123
var parameters = new Dictionary<string, object>() { { "business entity id", 123 } };
await cacheLoader.SetParametersAsync(parameters, cacheLoader.LocalCache, token);

// access the lookup table of addresses for the current business entity
var addressTable = await cacheLoader.LocalCache.GetLookupTableAsync("business entity address");
```

:::info
Local parameterized lookup cache loaders like this are used to read and cache a list of possible values for an [`EnumProperty`](properties/enum#local-cache) based on the value(s) of other data properties.
:::

### Generic dictionary loader

When you have a number of simple enumerated lists of fairly static items, then instead of storing each list in its own table you can create a generic dictionary table that would store all of those items using a common structure.

:::tip
Storing enumerated lists in a generic dictionary can also allow you to define new lists dynamically in runtime.
:::

Each item would typically have its own *item type* and a string-based *item code* that serves as an ID within that type. It can also have a user-friendly *text* and possibly a collection of *named attributes* with their values, which you can store in a child table.

If you have a service operation that returns all the dictionary data, such as `ReadDictionaryAsync`, it could return an `Output<ICollection<DictionaryItem>>` using the following structures.

```cs
public class DictionaryItem
{
    public string ItemType { get; set; }
    public string ItemCode { get; set; }
    public string Text { get; set; }
    public ICollection<ItemAttribute> Attributes { get; set; }
}

public class ItemAttribute
{
    public string Name { get; set; }
    public string Value { get; set; }
}
```

You can create and register a `DictionaryCacheLoader` based on this `ReadDictionaryAsync` service operation, which would load lookup tables for all item types in the dictionary. Since the list of supported item types may not be known at design time, you can pass no `supportedTypes` to the base constructor, as follows.

```cs
public DictionaryCacheLoader(IServiceProvider serviceProvider)
/* highlight-next-line */
    : base(serviceProvider, LookupCache.Global, true) // no supported types at initialization
{
}
```

:::note
Since the list of supported types is initially unknown, the first time the global cache will try to load any table, it will ask the `DictionaryCacheLoader` to load all the data. After that the dictionary loader will know which tables it can load based on the actual data, and will reload the data only for one of those lookup tables.
:::

The implementation of the `LoadCacheAsync` method will use the `ItemType` of each returned item to place it in the proper lookup table, as illustrated by the following code snippet.

```cs
protected override async Task LoadCacheAsync(string tableType, CacheUpdater updateCache,
                                             CancellationToken token = default)
{
    // read dictionary of items with their attributes
/* highlight-next-line */
    var output = await ReadDictionaryAsync();
    if (output?.Messages != null)
        output.Messages.AbortIfHasErrors();
    else if (output?.Result == null) return;

    // build the data for lookup tables from the result
    var data = new Dictionary<string, Dictionary<string, Header>>();
    foreach (var row in output.Result)
    {
/* highlight-next-line */
        string type = row.ItemType; // item type returned for each row

        if (!data.TryGetValue(type, out Dictionary<string, Header> tbl))
        {
            data[type] = tbl = new Dictionary<string, Header>();
        }
/* highlight-next-line */
        string id = row.ItemCode;
        if (!tbl.TryGetValue(id, out Header h))
        {
/* highlight-next-line */
            tbl[id] = h = new Header(type, id, row.Text);
        }
// highlight-start
        foreach (var attr in row.Attributes)
            h.AddToAttribute(attr.Name, attr.Value);
// highlight-end
    }

    // if no data is returned we still need to update cache to mark it as loaded
    if (data.Count == 0) updateCache(new LookupTable(tableType, new List<Header>(), true));

    // update cache for each lookup table loaded
    foreach (string type in data.Keys)
        updateCache(new LookupTable(type, data[type].Values, caseSensitive));
}
```

### Static XML data loader

If you have lookup data that is based on static enumerations and cannot be changed in runtime, then you can also put it into an XML file, e.g. `enumerations.resx`, and include it as an embedded resource with your code. Xomega Framework provides a class `XmlLookupCacheLoader` that will be able to load this data from your embedded resource file and put it into the global lookup cache.

The format of the XML data is based on the [Xomega model for static data](../../visual-studio/modeling/static-data), where each lookup table is represented by an `enum` element, which has a list of `item` elements for the actual items, and each item may have some `prop` child elements for its named attributes, as illustrated in the following example.

```xml title="enumerations.resx"
<enums xmlns="http://www.xomega.net/omodel">
  <enum name="yesno">
    <item name="Yes" value="true"/>
    <item name="No" value="false"/>
  </enum>
<!-- highlight-next-line -->
  <enum name="operators">
    <properties>
      <property name="sort order"/>
      <property name="addl props" default="0"/>
      <property name="null check" default="0"/>
    </properties>
<!-- highlight-start -->
    <item name="Is Null" value="NL">
      <prop ref="sort order" value="00"/>
      <prop ref="null check" value="1"/>
    </item>
<!-- highlight-end -->
    <item name="Is Equal To" value="EQ">
      <prop ref="sort order" value="10"/>
      <prop ref="addl props" value="1"/>
    </item>
    ...
  </enum>
  <enum name="sales order status">
    <item name="In process" value="1"/>
    <item name="Approved" value="2"/>
    <item name="Backordered" value="3"/>
    <item name="Rejected" value="4"/>
    <item name="Shipped" value="5"/>
    <item name="Cancelled" value="6"/>
  </enum>
</enums>
```

:::note
You can also have `property` elements under the `properties` node that provide default values for the named attributes.
:::

In order to register an `XmlLookupCacheLoader` for your resource file during the startup, you can call the `AddXmlResourceCacheLoader` extension method, and give it the assembly that contains your embedded resource, as well as the name of the resource file, as follows.

```cs
public void ConfigureServices(IServiceCollection services)
{
    ...
/* highlight-next-line */
    services.AddXmlResourceCacheLoader(GetType().Assembly, ".enumerations.xres", false);
}
```
---
sidebar_position: 3
---

# Querying Data

You can employ any number of technologies to query the database in your business services - from using direct SQL commands with ADO.NET or calling stored procedures to using LINQ over EF Core entities.

Xomega Framework provides additional support for the dynamic construction of LINQ queries using flexible operators with the user-supplied filter criteria, as described below.

## Dynamic LINQ criteria

When you have a service operation that needs to return a list of records (DTOs) based on a set of criteria that is supplied as the operation input and may also contain some operators for those criteria, then you can leverage `AddClause` methods provided by the base service class, in order to dynamically construct a LINQ query over your EF entities.

For example, imagine that you have a `ReadList` operation that returns a list of sales orders based on the provided `criteria` structure, which has values for filter criteria by certain fields, possibly coupled with a corresponding operator, such as `OrderDate` and `OrderDateOperator`. Some of the criteria fields may be also among the returned sales order fields, while others may not be.

If you have a filter by a field that is not in the result list, such as `CreditCard` then you can call `AddClause` on the original `src` query that selects `SalesOrder` entities from the current DB context.

For the filters by any fields that are returned in the resulting list, such as `OrderDate` and `Customer`, you can call `AddClause` on the `qry` expression that selects the resulting `SalesOrder_ReadListOutput` DTOs, as illustrated by the following code snippet.

```cs
public virtual async Task<Output<ICollection<SalesOrder_ReadListOutput>>> ReadListAsync(
    SalesOrder_ReadListInput_Criteria criteria, CancellationToken token = default)
{
    ICollection<SalesOrder_ReadListOutput> res = null;
    ...
/* highlight-next-line */
    var src = from obj in ctx.SalesOrder select obj;

    // add criteria for the source object by any fields that are not in the result
/* highlight-next-line */
    src = AddClause(src, "CreditCard", o => o.CreditCard, criteria?.CreditCard);

    var qry = from obj in src
              select new SalesOrder_ReadListOutput() {
                  SalesOrderId = obj.SalesOrderId,
                  OrderDate = obj.OrderDate,
                  Customer = obj.Customer.Name,
                  ...
              };

    // add criteria for the result query by any fields that are returned in the result
/* highlight-start */
    qry = AddClause(qry, "OrderDate", r => r.OrderDate, criteria?.OrderDateOperator, criteria?.OrderDate);
    qry = AddClause(qry, "Customer", r => r.Customer, criteria?.CustomerOperator, criteria?.Customer);
/* highlight-end */
    ...
    currentErrors.AbortIfHasErrors();
    res = await qry.ToListAsync(token);
    ...
    return new Output<ICollection<SalesOrder_ReadListOutput>>(currentErrors, res);
}
```

As you can see, the base service provides multiple variants of the `AddClause` method to support operators and multiple values, which allows you to add complex criteria to your LINQ queries with just a single line of code.

### AddClause methods

The `AddClause` methods provided by the base service take the LINQ expression for your query, the field name to be used in any error messages, a LINQ expression to get the value of the field, an optional operator and one or more criteria values, and returns a LINQ expression for updated query, which you can assign to the same variable.

If the operator is passed as `null` or the criteria values are `null` or empty, meaning that no filter by the field is supplied, then it will return an identical query, which saves you from any tedious null checks. Otherwise, it will construct a new LINQ expression with a `Where` clause based on the provided criteria, and will return it to the caller.

If you don't provide an operator, a default operator will be used based on the criteria values that you pass. If you pass a collection of values, then the default operator is `One Of` / `In`. If you pass two separate values, then the default operator will be `Between`. Otherwise, the `Equal To` operator will be used.

Below are some examples of using `AddClause` methods with and without operators, and using different types of criteria.

```cs
// adds a filter where the Order Date is January 1, 2012
qry = AddClause(qry, "OrderDate", r => r.OrderDate, new DateTime(2012, 1, 1));

// adds a filter where the Order Date is in February 2012
qry = AddClause(qry, "OrderDate", r => r.OrderDate, "BW", new DateTime(2012, 2, 1), new DateTime(2012, 3, 1));

// adds a filter where Status is in one of the provided values
qry = AddClause(qry, "Status", r => r.Status, new[] { 1, 2, 3, 5 });

// adds a filter where Status is not in one of the provided values
qry = AddClause(qry, "Status", r => r.Status, "NotIn", new[] { 4, 6 });

// adds a filter where Status is 1-2 or 4-7 using an array of dynamic range operators
qry = AddClause(qry, "Status", r => r.Status, new[] { "[1,2]", "[4,7]" });

// adds a filter where the Customer name starts with "Micro"
qry = AddClause(qry, "Customer", r => r.Customer, "SW", "Micro");
```

:::warning
If you provide either an invalid operator or fewer values than the operator expects (e.g. 1 value for the `Between` operator), then the method will not change the query but will add a corresponding error to the `currentErrors` using the specified property name in the text of the error message.
:::

## Query operators{#operators}

Xomega Framework provides a flexible and extensible framework for defining operators that can be used in conjunction with additional filter values or as filters by themselves without any additional values.

Each operator has one or more names that it can be looked up by in the registry of operators, which provides the flexibility to use multiple aliases, e.g. `EQ`, `=`, `==`, `Is`, `Equal`, `Equals`. The same comparison operator may be used by different names for different types of values, e.g. `LessOrEqual` for numbers and `EarlierOrAt` for dates.

All operators in Xomega Framework inherit from the `Operator` base class, which is constructed with the following parameters.
- `NumberOfValues` - the number of values the operator takes (0-2). For operators that take an unbounded list of values, such as `In`, this parameter is set to -1.
- `Negate` - Whether the operator will negate the predicate. Allows defining both an operator and an inverse operator in the same class using different names based on this parameter, e.g. `In` and `NotIn`.

If you need to implement a custom operator, then you must subclass the `Operator` class, and implement the following abstract methods.

```cs
// Gets all known names and aliases for the current operator, considering the Negate flag.
public abstract string[] GetNames();

// Builds the base predicate expression for the operator using the specified property and values accessors.
protected abstract Expression BuildExpression<TElement, TValue>(
    Expression<Func<TElement, TValue>> prop, params Expression<Func<TValue>>[] vals);

// Implementation of the operator's value matching logic for in-memory filtering.
protected abstract bool Match(object value, params object[] criteria);
```

:::tip
Defining custom operators may be useful if your field contains some special values. For example, to filter customers where the name is "N/A" or "NA", you can define a special operator `IsNA`.
:::

### Registering operators

Xomega Framework provides an `OperatorRegistry` class to allow registering operators and looking them up by name. By default, the `OperatorRegistry` class registers all [standard operators](#standard-operators) supported by Xomega Framework.

To make the operator registry accessible to the base service and all other services, you need to register it as a singleton in your startup class using either an extension method or explicitly, as follows.

```cs
/* highlight-next-line */
services.AddOperators(); // register using an extension method
services.AddSingleton<OperatorRegistry>(); // or register explicitly
```

If you need to register any custom operators, then you can also manually create a new `OperatorRegistry`, and call its `Register` method to register your operators before adding it as a singleton, as follows.

```cs
var opRegistry = new OperatorRegistry(true); // true to register standard operators
/* highlight-next-line */
opRegistry.Register(new MyOperator(), new CustomOperator());
services.AddSingleton<OperatorRegistry>(opRegistry);
```

:::tip
You can also create and add a custom subclass `MyOperatorRegistry` instead, which would register your operators as needed. This will also allow you to override and enhance the lookup logic in the `GetOperator` method, which by default looks up a registered operator by name in a case-insensitive manner, and also tries to construct a [dynamic range operator](#dynamic-operators) based on the value type.
:::

### Standard operators

Xomega Framework includes the following standard operators that can be used out of the box.

|Class|Negated|Operator names|Description|
|-|-|-|-|
|`IsNullOperator`||`NL`, `Null`, `IsNull`|Checks if a property value is null.|
|`IsNotNullOperator`||`NNL`, `NotNull`, `IsNotNull`|Checks if a property value is not null.|
|`EqualToOperator`||`=`, `==`, `Is`, `Equal`, `Equals`|Checks if a property value is equal to a single value.|
|`NotEqualToOperator`||`!=`, `<>`, `NEQ`, `IsNot`, `NotEqual`, `NotEquals`|Checks if a property value is not equal to the specified value.|
|`OneOfOperator`||`OneOf`, `In`|Checks if a property value is in a list of values.|
|`OneOfOperator`|Yes|`NoneOf`, `NotIn`, `NIn`|Checks if a property value is not in a list of values.|
|`ContainsOperator`||`CN`, `Cont`, `Contains`|Checks if a property value contains a substring.|
|`ContainsOperator`|Yes|`NCN`, `NotCont`, `NotContains`|Checks if a property value does not contain a substring.|
|`StartsWithOperator`||`SW`, `Start`, `StartsWith`|Checks if a property value starts with a substring.|
|`StartsWithOperator`|Yes|`NSW`, `NotStart`, `NotStartWith`|Checks if a property value doesn't start with a substring.|
|`LessThanOperator`||`LT`, `Less`, `LessThan`, `Earlier`|Checks if a property value is less than the specified value.|
|`LessThanOrEqualOperator`||`LE`, `LessEq`, `LessOrEqual`, `LessThanOrEqual`, `EarlierOrAt`|Checks if a property value is less than or equal to the specified value.|
|`GreaterThanOperator`||`GT`, `Greater`, `GreaterThan`, `Later`|Checks if a property value is greater than the specified value.|
|`GreaterThanOrEqualOperator`||`GE`, `GreaterEq`, `GreaterOrEqual`, `GreaterThanOrEqual`, `LaterOrAt`|Checks if a property value is greater than or equal to the specified value.|
|`BetweenOperator`||`BW`, `Between`|Checks if a property value is in the specified range.|
|`BetweenOperator`|Yes|`NBW`, `NotBetween`|Checks if a property value is not in the specified range.|

:::tip
Some operators have a static constant `DefaultName` that you can use in the code instead of hardcoding the operator's name, e.g. `EqualToOperator.DefaultName`.
:::

## Dynamic operators

Dynamic operators don't need to be registered upfront, but can be constructed dynamically based on the supplied operator string. This allows the operator string to encode specific values, which would be impossible to register upfront.

Xomega Framework provides a class `DynamicRangeOperator` that implements dynamic operators for ranges of relative or absolute dates and numbers. If the `OperatorRegistry` cannot find a standard operator by a registered name, it will try to construct a dynamic range operator from that string for either dates or numbers based on the provided value type.

:::note
If you need to support any other dynamic operators, you'll need to provide your own implementation class, and override the `GetOperator` method of the `OperatorRegistry` in order to create it from the supplied operator string and value type.
:::

The operator string that you use for dynamic ranges has the following format `[<from>,<to>]`, where the `<from>` and `<to>` are the lower and upper bound of the range respectively.

The range specified like that will be inclusive. To exclude one or both bounds from the range you should use parenthesis instead of the square brackets, e.g. `[<from>,<to>)` to exclude the upper bound.

You can also omit either `<from>` or `<to>`, which would make the range unbounded at that end, e.g. `[<from>,)` for anything starting at the specified lower bound.

### Relative date ranges

For each lower/upper bound of the range you can use a relative date, such as `ct` for the current time, `bo(s/m/h/d/w/M/y)` for the beginning of second, minute, hour, day, week, month or year respectively, or the `eo(s/m/h/d/w/M/y)` for the end of the same period. You can further adjust it by adding or subtracting a certain number of periods, e.g. `-60d` to subtract 60 days.

:::info
The beginning and the end of the week will be based on the current culture, e.g. Monday vs. Sunday.
:::

Below are some examples of how you can define relative date ranges with the explanation of each operator.

|Range|Operator|Description|
|-|-|-|
|Today|`[bod,eod)`|From the beginning of today to the end of today exclusively.|
|This Week|`[bow,eow)`|From the beginning of the current week to the end of week exclusively.|
|This Month|`[boM,eoM)`|From the beginning of the current month to the end of month exclusively.|
|YTD|`[boy,bod)`|From the beginning of the current year to the beginning of today exclusively.|
|Last 30 Days|`[bod-30d,ct]`|From 30 days prior to beginning of today to the current time.|

:::tip
Using relative date ranges provides a quick way to filter by dates and times, and also allows saving such filters for future reuse.
:::

### Absolute date ranges

In addition to relative dates, you can also specify absolute dates for either the lower or upper bounds of the range using `yyyy-MM-dd` format. For example, operator `[2020-03-20,bod)` would apply to all dates starting on March 20, 2020 up until the current date.

:::note
Providing absolute dates for both the lower and upper bounds inclusively would be tantamount to using a `Between` operator and passing those dates as the first and the second values to the `AddClause` method.
:::

### Number ranges

Similar to the date ranges, you can construct number ranges for numeric value types. You can use both integer and decimal numbers for the lower or upper bounds of the range. For example, operator `[10,100)` would apply to all integer values from 10 to 99.

While you can let the users select standard operators, such as `GreaterThan` or `GreaterOrEqual`, and specify the values manually, providing preconfigured ranges could make it more convenient to quickly filter the values. You can also give those ranges some custom names.

For example, to filter something by price you can define low, medium, and high price ranges,  which you can call  `Budget`, `Average` and `Luxury` respectively, as follows.

|Range|Operator|
|-|-|
|Budget|`[0,100)`|
|Average|`[100,1000)`|
|Luxury|`[1000,)`|

:::note
The last range doesn't have an upper bound, so it applies to all prices of 1000 and above.
:::
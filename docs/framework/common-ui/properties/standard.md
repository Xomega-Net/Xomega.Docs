---
sidebar_position: 1
---

# Standard Properties

Xomega Framework includes several data properties for standard data types, as described below.

## General properties

Below are some general data properties included with the Xomega Framework.

### TextProperty

The `TextProperty` class stores its value as a `string` and converts any value to a string using the `Convert.ToString` method.

If you set the `Size` of your text property to any positive number, then it will validate that the length of the stored string is no longer than the specified size.

### BooleanProperty

The `BooleanProperty` class stores its value as a `bool?` to allow storing `null` values. It can convert the input string to a boolean using various formats, e.g. "true", "1" or "yes" for the `true` value, and "false", "0" or "no" for the `false` value.

:::tip
You can customize the list of strings that represent `true` or `false` values by setting the corresponding static arrays `BooleanProperty.TrueStrings` and `BooleanProperty.FalseStrings` respectively.
:::

The property value will be always displayed as a string as either "true" or "false" using the `ToString` method.

### GuidProperty

The `GuidProperty` class stores its value as a `Guid?` to allow storing `null` values. It parses the input string as a `Guid` using the standard `Guid.TryParse` method, and displays it as a string using the standard `ToString` method.

## Integer properties

All integer properties in Xomega Framework store their value as a nullable of one of the integer types, as described below.

### BigIntegerProperty

The `BigIntegerProperty` class validates that the stored value is a `long?` between the `long.MinValue` and `long.MaxValue`.

### PositiveBigIntProperty

The `PositiveBigIntProperty` class validates that the stored value is between `1` and `long.MaxValue`.

### IntegerProperty

The `IntegerProperty` class validates that the stored value is an `int?` between the `int.MinValue` and `int.MaxValue`.

### PositiveIntegerProperty

The `PositiveIntegerProperty` class validates that the stored value is between `1` and `int.MaxValue`.

### SmallIntegerProperty

The `SmallIntegerProperty` class validates that the stored value is a `short?` between the `short.MinValue` and `short.MaxValue`.

### PositiveSmallIntProperty

The `PositiveSmallIntProperty` class validates that the stored value is between `1` and `short.MaxValue`.

### TinyIntegerProperty

The `TinyIntegerProperty` class validates that the stored value is a `byte?` between the `byte.MinValue` and `byte.MaxValue`.

### Integer key properties

Xomega Framework defines the following set of marker subclasses of the corresponding integer property that indicate that its value is used as a key of an entity, as opposed to just regular properties.

- `BigIntegerKeyProperty` - a key property of underlying type `long`.
- `IntegerKeyProperty` - a key property of underlying type `int`.
- `SmallIntegerKeyProperty` - a key property of underlying type `short`.
- `TinyIntegerKeyProperty` - a key property of the underlying type `byte`.

:::note
This allows treating such properties differently in certain scenarios. For example, when adding search criteria by a field that contains integer keys, the corresponding `OperatorProperty` will include only equality operators, but not the comparison operators, such as "*Less Than*" or "*Greater Than*".
:::

## Decimal properties

All decimal properties in Xomega Framework store their value as a `decimal?` but may provide some restrictions on the minimum and maximum values, or format the value in a certain way, as described below.

### DecimalProperty

The `DecimalProperty` class validates that the stored value is between the `decimal.MinValue` and `decimal.MaxValue`, but you can set your custom `MinimumValue` and `MaximumValue`. You can also set the `MinimumAllowed` and `MaximumAllowed` flags on the property to indicate whether the `MinimumValue` and `MaximumValue` are valid values.

The decimal value can be parsed from a string using the `NumberStyles.Number` formats, but you can set the `ParseStyles` on the property to your custom styles.

It will use the `ToString` method to show the value as a string, but you can also set a custom `DisplayFormat` to show it as a `DisplayString` using the specified format (but not as an [`EditString`](base#value-formats)).

### PositiveDecimalProperty

The `PositiveDecimalProperty` class validates that the stored value is between `0` and `decimal`.MaxValue`. You can also set the `MinimumAllowed` to `false` for truly positive numbers greater than 0.

### MoneyProperty

The `MoneyProperty` is a decimal property that displays its value in a currency format for the current culture. It also parses the input string using the `NumberStyles.Currency` styles.

### PositiveMoneyProperty

The `PositiveMoneyProperty` is a money property that validates that the stored amount is not negative. You can also set the `MinimumAllowed` to `false` for truly positive amounts greater than 0.

### PercentProperty

The `PercentProperty` is a decimal property that displays its value in a percent format for the current culture.

### PercentFractionProperty

The `PercentFractionProperty` ensures that its value is between 0 and 1, meaning that it cannot be more than 100%.

## Date/time properties

All date/time properties in Xomega Framework store their value as a `DateTime?` but may format the value in a certain way, as described below.

### DateTimeProperty

The `DateTimeProperty` parses the input string using the standard `DateTime.TryParse` method, and displays the value as a string using a space-delimited `ShortDatePattern` and `ShortTimePattern` of the `DateTimeFormatInfo.CurrentInfo`. You can specify a custom display format by setting its `Format` member though. The property will check that its value is a `DateTime` during validation.

### DateProperty

The `DateProperty` is a date/time property that formats its string value using `DateTimeFormatInfo.CurrentInfo.ShortDatePattern`.

### TimeProperty

The `TimeProperty` is a date/time property that formats its string value using `DateTimeFormatInfo.CurrentInfo.ShortTimePattern`.

It can also parse the time of day from a single number, e.g. using a military format such as "1500".

:::tip
You can set the `MinutesCentric` property to `true` to treat a number less than 24 as minutes. In this case, for example, "15" would be parsed as "00:15" rather than as "15:00".
:::
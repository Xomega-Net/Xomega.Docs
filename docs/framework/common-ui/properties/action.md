---
sidebar_position: 3
---

# Action Properties

Action properties represent abstract metadata about the actions that the user can perform on your screen, which includes the following.
- **Action name**, which should be unique within the context it's used in and serves as a resource key.
- **Localized action text** that is displayed to the user on the UI.
- **Enabled indicator** that tells if the action is currently enabled.
- **Visibility** of the action indicates whether or not the action is currently visible.

Action properties can be bound to various action controls on the UI, such as buttons, menu options, etc. Any changes in the action's enabled state or visibility would be automatically reflected in the bound UI control, which allows you to implement the logic for enabling, disabling and hiding your actions in a **UI-agnostic** way.

:::warning
Action properties **do not perform the actual action**, but only manage the state of that action. You still need to set the proper handler on the bound UI control, which would invoke your logic for that action.
:::

:::note
The `ActionProperty` class that is used for action properties extends `BaseProperty` to support the state management and property change events. However, it **does not carry any data**, nor store any value, so it doesn't extend the `DataProperty` class.
:::

## Constructing actions

Action properties can be defined either as part of a parent data object or as standalone actions that you can store on your view model.

### Data object actions

When an action logically belongs to a certain data object, then you can construct it and store it inside that data object, and pass that object as a parent along with the unique action name, similar to the way you [construct regular data properties](base#initialization-and-description). For example, if your data object has a *RecalculateAction*, then you can construct it as follows.

```cs title="MyDataObject.cs"
protected override void Initialize()
{
/* highlight-next-line */
    RecalculateAction = new ActionProperty(this, Messages.Action_Recalculate);
}
```

Just like with data properties, actions created with a parent object will be registered within that object. This allows the data object to manage these actions and recalculate their state as needed.

:::info
Data objects already define and track the state of some standard actions, such as *Save* and *Delete*, which you can then bind to the corresponding buttons on your screen, as needed.
:::

### View model actions

If your action doesn't belong to any data object, then you need to construct it with a *service provider* instead of the parent object, so that it could access registered resources. You should define actions for a specific view on the corresponding *view model* class. For example, the base `ViewModel` class defines a `CloseAction` as follows.

```cs
public ViewModel(IServiceProvider svcProvider)
{
/* highlight-next-line */
    CloseAction = new ActionProperty(svcProvider, Messages.Action_Close);
}
```

## Localized action text

The localized text for the action that is displayed on the bound UI control, as well as the access key mnemonic, comes from the registered string resources using the action name as the key, which can be possibly prefixed with the parent object's key, as described for the standard [data property label](base#property-label).

For example, if you have a data object `SalesOrderObject`, then the text for its standard `SaveAction` will be first looked up using a resource key `SalesOrderObject.Action_Save`, and then, if the resource is not found, by the standard key `Action_Save` that returns the default text. This allows you to override the standard *Save* text for a specific data object, to be *Submit*, for example.

## Manage enabled state

You can manually set the enabled state of your action from a data object or a view model by setting the `Enabled` flag, and it will automatically enable or disable the bound UI button. For example, the following code sets the enabled state of a `RecalculateAction` based on whether or not the data object is modified.

```cs
// manually set enabled state of the Recalculate action
myObj.RecalculateAction.Enabled = myObj != null && myObj.Modified;
```

:::note
The `Enabled` flag of an `ActionProperty` is based on the [`Editable`](base#property-editability) flag of the `BaseProperty`, except that the action is not necessarily disabled when the parent object is not editable. Therefore, setting `Enabled` flag will trigger a property change event with [`PropertyChange.Editable`](base#property-changes) as the change.
:::

### Enabling conditions

The problem with manually managing the `Enabled` flag is that you have to update it whenever the enabling conditions change. In the previous example, you would have to track when the object becomes modified and update the flag accordingly.

So, it's much easier to just specify the enabling conditions for your action as an expression, and then call the `SetComputedEnabled` method with that expression and all the parameter values. This is the same as setting [computed editability](base#computed-editability) on a data property.

For the `RecalculateAction` from above, setting automatic enabling conditions would look as follows.

```cs
// set enabling conditions for Recalculate action that auto-update the enabled state
Expression<Func<DataObject, bool>> recalculateEnabled = (obj) => obj != null && obj.Modified;
myObj.RecalculateAction.SetComputedEnabled(recalculateEnabled, myObj);
```

## Control action visibility

Similar to controlling the enabled state, you can manually control the action's visibility by setting its `Visible` flag, and the bound UI button will become hidden as appropriate.

For example, if you have a view that can be opened either as a primary view or as a child of another view, then you can hide the `CloseAction` when the view is not a child view, as follows.

```cs
CloseAction.Visible = isChildView;
```

:::tip
If the action should not be visible due to security permissions, then you can also set its [`AccessLevel`](base#access) to `None`.
:::

### Visibility conditions

Just like with enabling conditions, instead of manually setting the `Visible` flag you may want to specify the action visibility conditions, and that flag will be automatically updated whenever those conditions change.

All you have to do is to create an expression that returns the visibility, and then call the [`SetComputedVisible`](base#computed-visibility) with that expression and any parameter values that it uses, just like you do for regular data properties.

In the following example, we hide the `DeleteAction` on a data object while it's being created, and then show the delete action after the new data object has been saved.

```cs
Expression<Func<DataObject, bool>> deleteVisible = (obj) => obj != null && !obj.IsNew;
DeleteAction.SetComputedVisible(deleteVisible, this);
```

:::tip
For your computed property to be auto-updated, your expression must use either data properties, regular properties of objects that implement `INotifyPropertyChanged`, or selected rows of a data list object (e.g. when you enable or hide an action based on the data list selection).
:::
---
sidebar_position: 3
---

# Running Generators

Xomega.Net provides multiple ways to run single or multiple generators based on the changes you have made and depending on the generators.

## Building the model project

The most common generation use case is to run multiple generators on the entire model at once, in order to regenerate everything that you need from your model. This process may take longer, but it guarantees that all your model changes will be reflected in the regenerated artifacts.

To configure the generators that should be run together, you need to set the [`IncludeInBuild`](configuring-generators#include-in-build) parameter to `true` on the `Generator` element of the configuration for those generators as follows.

```xml title="Xomega Data Objects.xgen"
<XomGeneratorConfig xmlns="http://schemas.xomega.net/v10/xgen"
                    xmlns:cls="http://schemas.xomega.net/v10/xgen/classes">

  <Generator Xsl="UI/Common/data_objects.xsl"
             GeneratorGroup="presentation"
             IndividualFiles="true"
<!-- highlight-next-line -->
             IncludeInBuild="true"/>
  ...
</XomGeneratorConfig>
```

Now, to run those generators, you just need to right-click on your model project in the *Solution Explorer*, and select the `Build` option, as shown below.

![Build menu.png](img/build-menu.png)

:::warning
By default, the **model project is not included in the solution build**, since running multiple generators can take some time, and you want to do it only after you change something in the model itself, and not whenever you build your solution. That's why you need to **build the model project separately** through the context menu.
:::

## Viewing logs from the generation

The output console for the Build will print the generators being run and any warnings or other output from the generators as shown below.

```txt
Build started at 5:29 PM...
1>------ Build started: Project: DemoSolution.Model, Configuration: Debug Any CPU ------
1>  Validating Project Model.
1>  Generating EF Domain Objects.
1>\\none(1-1): warning : Property Address.SpatialLocation has been skipped, since no CLR type is defined for its type "geography"
1>  Generating Blazor Views.
1>  Generating Label Resources.
1>  Generating REST Service Clients.
1>  Generating View Models.
1>  Generating Xomega Data Objects.
1>  Generating WPF Views.
1>  Generating Service Contracts.
1>  Generating Service Implementations.
1>  Generating Web API Controllers.
1>  Generating Enumeration Constants.
1>  Generating Enumeration Data XML.
1>  Generating Lookup Cache Loaders.
========== Build: 1 succeeded or up-to-date, 0 failed, 0 skipped ==========
========== Build completed at 5:29 PM and took 05.592 seconds ==========
```

If for debugging purposes, you also want to see the specific files that were generated or updated during the generation, you can set the output verbosity to `Normal` in the *Build And Run* options of Visual Studio, as shown below.

![Verbosity setting](img/verbosity.png)

## Running individual generators

If you want to run a single generator or multiple individual generators on the entire model, you can select the generators that you want to run from the model project, right-click on them (or open the top-level *Project* menu), and select the *Generate* option, as follows.

![Generate menu](img/generate-menu.png)

:::tip
Some generators, such as *Blazor Views*, have a [`view:Selector`](../../generators/presentation/blazor/views#generator-parameters) config, where you can specify a single view that you want to generate. This allows you to create a configuration of such a generator for a specific single view, and then run it for that view only.
:::

## Running a generator on select files

If you are working on a specific file or a set of files, you can run a certain generator only for the selected files. To do that, you can select one or more `.xom` files in the model project, right-click on them, and select the generator from the *Generate* menu, as shown below.

![Generate select](img/generate-multiple.png)

This can be useful when you are working on a specific object and would like to regenerate something only for the selected object. But the most common use case is to run one of the *Model Enhancement* generators that would add or remove certain model elements to/from the selected files.

:::note
Not all generators support being run on selected files, but only those that have [`IndividualFiles`](configuring-generators#individual-files) parameter set to `true`. Other generators must be run on the entire model.

Conversely, some generators, such as [*Full CRUD with Views*](../../generators/model/crud), **must** be run on selected files only, since it doesn't make sense to run them on all objects.
:::

## Cleaning generator output

In addition to generating artifacts, Xomega.Net also allows you to clean the generated artifacts, where possible. In order to do that, you need to select the *Clean* menu option from the context menu on the model project, on a specific generator, or on the selected files.

:::danger
The *Clean* option will **delete** all generated files and any **mixed-in customizations**.

When adding mixed-in customizations, you can preserve them to survive a *Clean* operation by deleting a certain line in the generated header of the file, as instructed in the header text, or by configuring a `preserve-on-clean` attribute in the model. Please check the documentation on the corresponding generator for more details.
:::

Cleaning is useful when you are renaming model entities in such a way, that it affects the names of the generated files, and you need to clean up the old files.

If a generator adds something to a file, such as new model elements in the *Full CRUD with Views* generator, then the *Clean* operation should remove the added elements.

:::warning
Not all generators support cleaning the generated output. Please check the documentation on the corresponding generator.
:::

:::tip
Always check your files in your source control first to avoid losing your customization accidentally.
:::
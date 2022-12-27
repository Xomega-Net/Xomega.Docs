---
sidebar_position: 1
sidebar_label: Overview
pagination_prev: null
---

# Xomega Framework

Xomega Framework is a full-stack [open-source application framework](https://github.com/Xomega-Net/XomegaFramework) for quickly building well-architected data-oriented web or desktop apps in .NET.

The framework has been built from more than 20 years of experience and is based on an approach that has been proven in many large-scale enterprise applications. The primary goals of the framework are to:

- ✔️ Enable rapid application development.
- ✔️ Employ future-proof best practice architectures.
- ✔️ Promote reusability to reduce development and maintenance costs.
- ✔️ Ensure consistency to deliver the best user experience for your apps.

## Framework features

Following is a summary of the framework’s major features.

- ✅ Framework for [reusable Business Services](services/common), either exposed via remote REST API or integrated into the app.
- ✅ Common [error reporting framework](services/errors).
- ✅ [Lookup reference data](common-ui/lookup) handling and caching.
- ✅ Internationalization and localization support.
- ✅ [Generic MVVM framework](common-ui/overview) for the presentation data model and logic.
  - ☑️ Base classes for advanced Search and Details views.
  - ☑️ Consistent display of data in the proper formats.
  - ☑️ Automatic client-side validations with error display.
  - ☑️ Modification tracking with unsaved changes prompts.
- ✅ [Views](blazor/views) and [components](blazor/controls) that are bound-able to the generic view models for the following UI frameworks:
  - ☑️ Blazor Server.
  - ☑️ Blazor WebAssembly.
  - ☑️ [Syncfusion Blazor components](blazor/syncfusion/controls) with [in-grid editing](blazor/syncfusion/grid).
  - ☑️ WPF views and controls.
  - ☑️ Legacy ASP.NET WebForms.

## Why do I need it?

If you need to build data-oriented apps that require searching data by a variety of advanced criteria, displaying the results in a tabular grid, and viewing or editing details in separate forms or directly in the grids, then you should definitely consider using Xomega Framework.

### Line-of-Business apps

For example, let's consider that your team is building a large-scale enterprise-grade Line-of-Business application or a number of smaller-scale LOB applications.

If you go with a server-side architecture, such as Blazor Server, your developers may not provide a strict separation between the business services and the presentation logic, as per the best practices. This will make it difficult to expose those services via Web API and switch to a SPA architecture, such as Blazor WebAssembly. Xomega Framework provides a standardized way to implement business services, check security, perform validations, report errors, etc, which allows you to [**easily switch from one architecture to another**](services/common).

### Reusability

Without any framework, your developers will have to manually implement displaying data in the proper formats, modification tracking, client-side validations, and other common aspects of the presentation logic directly in each form. Those things will likely be copy-and-pasted from one form to another, thereby substantially increasing maintenance and testing costs, and negatively affecting the quality and consistency of the UI.

### Minimizing lock-in

The presentation logic you’ll write may end up being tightly coupled to the specific UI framework or even a component library that you use. This will make it cost-prohibitive to switch to a different component library, let alone move to a new UI framework. Given the fast-paced evolution of modern UI frameworks, this may significantly reduce the lifespan of your application, requiring a costly modernization a few years down the road.

Xomega Framework helps you to write a large part of your presentation logic in a platform-independent way, and then just bind to it a thin layer of UI views implemented with specific UI technologies. This allows you to **easily switch between various UI frameworks** and component libraries, and even **share the presentation logic** between different types of .NET applications, such as web, desktop, or mobile.

## Framework packages

The framework consists of the core package, as well as several additional packages that target specific technologies, as follows.

- `Xomega.Framework` - the core package that contains reusable code for both web or desktop clients and the service layer.
- `Xomega.Framework.AspNetCore` - support for hosting and using business services via REST API.
- `Xomega.Framework.Blazor` - implementation of views and property-bound components for Blazor Server and WebAssembly.
- `Xomega.Syncfusion.Blazor` - property-bound components based on the Syncfusion Blazor library.
- `Xomega.Framework.Wpf` - implementation of views and data bindings for WPF.
- `Xomega.Framework.Web` - implementation of views and data bindings for ASP.NET WebForms.
- `Xomega.Framework.Wcf` - support for hosting and using business services in WCF.

These packages are [available via NuGet](http://www.nuget.org/packages?q=xomega.framework), so you can always manually add them to your existing projects and configure them in the application’s startup classes if you like.

:::tip
The easiest and fastest way to get started with Xomega Framework is to [download and install our free VS extension](https://xomega.net/System/Download.aspx) [**Xomega.Net for Visual Studio**](../visual-studio/overview). It provides a *New Project* template with a solution wizard, where you can configure a new solution for any supported architecture, such as Blazor, WPF, ASP.NET, or SPA, or even pick multiple architectures that will share the same code.
:::

## Community and support

You can engage with the Xomega Framework community through the following channels.

- [Community Forum](https://github.com/Xomega-Net/Xomega.Net4VS/discussions) - browse or ask questions, suggest new features, or discuss Xomega Framework and the overall Xomega platform.
- [GitHub Issues](https://github.com/Xomega-Net/XomegaFramework/issues) - browse and report issues with Xomega Framework.


The following sections provide detailed documentation on the framework's support for building business services, the common UI logic, and specific UI technologies.
---
sidebar_position: 1
sidebar_label: Overview
pagination_prev: null
---

# Xomega Framework

Xomega Framework is a powerful [open-source framework](https://github.com/Xomega-Net/XomegaFramework) that helps you quickly build robust and future-proof data-driven .Net applications using both the modern technologies, such as Blazor and ASP.NET Core, as well as legacy frameworks, such as WebForms, WPF and WCF.

The primary goals of the framework are to:

- Enable rapid application development to speed up time-to-market.
- Promote reusability to reduce development and maintenance costs.
- Ensure consistency to deliver the best user experience for the application.

The framework has been built from more than 20 years of experience, and is based on the approach that has been proven in many large scale applications.

## Platform-independent logic

There exists a number of various frameworks in .Net ecosystem for building web, desktop and mobile applications. Most of them would lock your app into a specific UI technology (e.g. Blazor or WPF), or a certain communication framework, such as REST WebAPI. When a new UI or communication framework comes along, e.g. MAUI or gRPC, upgrading your app to the new technology may require a major rewrite, making the cost prohibitive to justify the benefits of the upgrade.

Yet, a large portion of the presentation and business logic in data-driven applications can be written using just the core .Net libraries and does not need to depend on a specific UI framework or communication technology. Xomega Framework was designed to allow you to build such platform-independent logic for your application and then easily integrate it with specific UI or backend technologies. This will make your app's logic not only future-proof and portable to other technologies, but also easily testable, as you won't need to mock those technologies.

## Xomega Framework packages

The framework consists of the core package, as well as several additional packages that target specific technologies, as follows.

- `Xomega.Framework` - the core package that contains reusable code for both web and desktop clients, as well as for the service layer.
- `Xomega.Framework.Wpf` - implementation of views and data bindings for WPF.
- `Xomega.Framework.Blazor` - implementation of views and property-bound components for Blazor Server and WebAssembly.
- `Xomega.Framework.AspNetCore` - support for hosting and using business services via REST API.
- `Xomega.Framework.Web` - implementation of views and data bindings for ASP.NET WebForms.
- `Xomega.Framework.Wcf` - support for hosting and using business services in WCF.

The following sections describe the framework's support for building business services, the common UI logic, and specific UI technologies.
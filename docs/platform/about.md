---
sidebar_position: 1
slug: /
---

# What is Xomega

If you have never heard of Xomega, let's give you a quick overview of what it is.

Xomega is an **extensible low-code platform** that helps you quickly build robust data-driven .NET applications in Visual Studio. It lets you **model your application** domain entities, services, and UI objects or views using simple but flexible, Xomega model structures. This allows you to *stay focused* on your business domain and on the structure of your application rather than on writing boilerplate plumbing code.

Once you define your application models, Xomega allows you to just **generate all layers of your application** from them, producing high-quality, customizable source code organized as per the best practice architectures for multi-tier, large-scale applications.

Your application will leverage our powerful [open-source Xomega Framework](https://github.com/Xomega-Net/XomegaFramework), which helps you write **clean, reusable, and testable code**. Coupled with code generation, it will ensure **consistent behavior and look-and-feel** across your entire app, which can also cut down on maintenance costs later on.

:::info
While you can generate both modern **Blazor Server** or **WebAssembly** applications, as well as the legacy *WebForms*, *TypeScript SPA*, or *WPF* applications, most of the code you write or generate will be **platform-independent**. This will help you to easily switch from one framework or technology to another and thereby **future-proof** your investment.
:::

## Xomega platform components

Xomega platform consists of the following components.

- **Xomega.Net extension for Visual Studio** provides an integrated environment for browsing and editing Xomega models and for configuring and running code generators right from Visual Studio.

- **Xomega solution wizard** helps you to pick and configure your system architecture and frameworks for each layer and then create the initial solution structure for your application to get started with no hassle.

- **Xomega modeling technology** allows you to model your application's logical types, business entities, services, UI objects, and other elements in a simple yet extensible, user-friendly XML format. You can specify the minimum information in the model, and Xomega will derive the rest from it.

- **Extensible Xomega generators** allow you to transform your models into source code, database scripts, technical documentation, or other artifacts for all application layers. The generators are **rerunnable**, meaning that you can iteratively update the model and regenerate all the necessary artifacts.

- **Open-source Xomega Framework** powers your application, taking care of common UI or business service logic and helping you write clean, reusable, and maintainable code that follows industry best practices for large multi-tier applications.

:::note
For **TypeScript** single page applications (SPAs), Xomega uses a different **[XomegaJS](https://github.com/Xomega-Net/XomegaJS)** framework for the UI layer, which is based on the `Knockout.js` library, as well as the `Durandal` framework.

This, however, may limit your UI code reuse with other C#-based clients.
:::

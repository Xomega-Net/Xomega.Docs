---
sidebar_position: 1
---

# Creating a Xomega Solution

Xomega.Net adds a new project template to Visual Studio that allows you to create and configure your solution for a specific architecture.

:::danger
This documentation applies only to the current version of Xomega.Net **for Visual Studio 2022**.
:::

## Xomega project template

:::warning
Due to a current limitation, you should not try to create a new Xomega solution (or open an existing one) when you have another Xomega solution open in your Visual Studio. You should first restart Visual Studio in this case.
:::

To create a new Xomega solution, select the *New Project* option in your Visual Studio and then pick *Xomega* project type to find the *Xomega Solution* template, as shown below.

![Solution template](img/solution-template.png)

Select the *Xomega Solution* template, and click *Next* to get to the following screen.

![Configure project](img/configure-project.png)

Set the project name, enter the location folder to create the solution in, optionally check the checkbox to place the solution and project in the same directory, and click *Create*.

## Selecting solution components

You should see a *Xomega Solution Configuration* screen, which allows you to set the target framework (.NET 9.0, if installed, or .NET 8.0), select an [authentication option](#authentication-options), and then pick and configure client-side and server-side technologies and projects that you want to use in your solution.

Usually, you just need to pick the main client-side technology, and any other projects that are required for your selection will be automatically included in the solution as well.

The following picture shows the required projects for the *Blazor* technology that includes *Blazor Server* and *Blazor WebAssembly* with `InteractiveAuto` rendering mode, and has a hosted REST API for the *WebAssembly*.

![Solution projects](img/solution-projects.png)

If you want to target several technologies at the same time, such as WPF, you can select additional projects here, and they'll share most of the presentation and business logic of your solution.

Similarly, you can pick additional service layer projects, e.g., to expose your services via WCF API to some legacy clients that cannot consume REST API for some reason.

### Authentication options

Xomega solution wizard allows you to pick one of the following supported authentication options.

#### Password (Custom)

This is the default option that sets up your solution with custom password-based authentication and configures all the plumbing for securing your services and UI for each of your selected technologies. This is a good option if you already store (or planning to store) all user authentication and authorization information in your application's database.

The default stubbed implementation for the authentication accepts any user name and just checks that the password is "password". It constructs a user identity with the only claim populated from the supplied user name. To implement your custom authentication you basically need do the following after creating your solution.

1. Open the `login.xom` under the *Auth* folder of  the `.Model` project, and update `user info` structure to add parameters for any additional claims that you want for the user. Build the `.Model` project after that to regenerate all the code.
1. Update `UserInfoPrincipalConverter` class in the *ServiceContracts/Auth* folder of the `.Services.Common` project to use those new parameters when converting `UserInfo` to/from the `ClaimsPrincipal`.
1. Update `LoginAsync` method of the `PasswordLoginServiceCustomized` class under the *Services/Auth* folder of the `.Services.Entities` project to validate the user name and password, as per the *TODO* comment in there.
1. Also, add code to the `LoginAsync` method to read and populate all fields of the updated `UserInfo` structure, as per the *TODO* comment in there.

You can learn more about details of the default password-based security plumbing, as well as see an example of how to implement authentication and authorization logic, in our [walkthrough tutorial](../../tutorial/security/overview).

#### ASP.NET Core Identity

This is a variation of the password-based authentication, where, instead of custom storage of the user authentication and authorization data, you want to use standard structures based on the ASP.NET Core Identity. This will allow you to leverage ASP.NET Core Identity framework to add standard web-based screens for managing user profiles and passwords.

The tables for ASP.NET Core Identity objects can reside either in your application database or in a separate database. In the latter case, you will be able to use that separate database as a central storage of user authentication and authorization data across multiple applications.

In either case, after you create the solution, you need to open the `db.config` file under the `.Services.Entities` project and update the `IdentityDB` connection string to point to the database that stores your ASP.NET Core Identity data. You can also refactor the startup code to pull the connection string from a different source, such as `appsettings.json` or an environment variable.

To create a separate web application for the users to manage their passwords and profile info, you can just add a new project using the standard template "ASP.NET Core Web App (Razor Pages)" and select "Individual Accounts" as the *Authentication Type* there. Then you can update the "DefaultConnection" there to point to your database with ASP.NET Core Identity data. If you don't have identity data set up yet, this project will allow you to create such a database using a migration.

If you don't want a separate web application for managing identity, you can just add identity to one of the ASP.NET Core projects of your solution, such as `.Client.Blazor` or `.Services.Rest`, by calling `services.AddDefaultIdentity<IdentityUser>()` in the corresponding startup code.

#### None

This authentication option allows you to create a solution without any authentication and authorization plumbing code. You can select this option if you are planning to add your own authentication code using third-party identity providers, of if you just want to explore Xomega solutions without any authentication.

## Reviewing solution configuration

Once you select the projects for your solution, you can click *Preview* to view and update the configuration of the selected projects.

You can customize each project's name and select project-specific options, such as which Blazor components to use, as shown below.

![Blazor config](img/blazor-config.png)

:::tip
You can also specify this configuration for each project on the previous screen by expanding the corresponding projects.
:::

Some key configuration of a project may be also displayed next to that project in parenthesis, e.g. *( Auto + API )*.

:::warning
Changing some configurations may result in other projects becoming included or excluded. For example, if you uncheck the *WebAssembly rendering* option, this will remove the *Blazor WebAssembly* and *REST API* projects from the selection.
:::

### Solution configuration parameters

Below is the full list of parameters that you can configure for different solution projects.

- **ASP.NET Core Blazor** - the main project for Blazor solutions.
  - *Project* - the name of the project to use.
  - *Interactive Server rendering* - use Blazor Server for interactive screens.
  - *WebAssembly rendering* - host and use Blazor WebAssembly for interactive screens. If *Interactive Server rendering* option is also selected, the solution will use the `InteractiveAuto` rendering mode.
  - *REST API hosting* - host REST API for WebAssembly in this Blazor project rather than as a standalone project.
- **Blazor WebAssembly** - part of the main Blazor project, if *WebAssembly rendering* is selected. Otherwise, a standalone WebAssembly project with a separate REST API.
  - *Project* - the name of the project to use.
- **Shared Blazor Components** - components shared between Blazor Server and WebAssembly projects.
  - *Project* - the name of the project to use.
  - *Components* - Blazor component library to use, as follows.
    - `Xomega Framework Blazor` - standard Bootstrap-styled Blazor components for Xomega Framework.
    - `Xomega Syncfusion Blazor` - Syncfusion Blazor components adapted for Xomega Framework.
- **TypeScript SPA** - TypeScript-based web client that uses [XomegaJS](https://github.com/Xomega-Net/XomegaJS) and `knockout.js` frameworks.
  - *Project* - the name of the project to use.
- **ASP.NET WebForms** - legacy ASP.NET web client.
  - *Project* - the name of the project to use.
- **MAUI** - desktop/mobile client for MAUI applications.
  - *Project* - the name of the project to use.
  - *Blazor Hybrid* - use Blazor components for the MAUI app (currently the only option, so it's always on).
  - *API Tier* - the way the app will access business services, as follows.
    - `2-Tier App` - business services are built into the app, which will access the DB directly.
    - `REST API` - business services are hosted separately and accessed via REST API.
- **WPF** - desktop client for WPF applications.
  - *Project* - the name of the project to use.
  - *API Tier* - the way the app will access business services, as follows.
    - `2-Tier App` - business services are built into the app, which will access the DB directly.
    - `REST API` - business services are hosted separately and accessed via REST API.
    - `WCF API` - business services are hosted separately and accessed via WCF API.
- **Presentation Logic** - presentation logic that can be shared between all clients.
  - *Project* - the name of the project to use.
- **Xomega Model** - project for modeling your domain and service models, from which application layers are generated.
  - *Project* - the name of the project to use.
- **Entity Model Diagrams** - project for creating entity data model diagrams.
  - *Project* - the name of the project to use.
- **Shared Code between Services and Clients** - DTOs, service interfaces and other shared code.
  - *Project* - the name of the project to use.
  - *Use Async operations* - use asynchronous service operations. Synchronous operations should be used in very special legacy cases.
- **Business Services Implementations** - domain entities and implementations of service interfaces.
  - *Project* - the name of the project to use.
  - *ORM* - Object-Relational Mapping framework to use, as follows.
    - `EF Core` - use newer Entity Framework Core.
    - `EF 6.x` - use older Entity Framework 6.x.
  - *Database* - database system to use for the solution, as follows.
    - `SQL Server` - use Microsoft SQL Server.
    - `PostgreSQL` - use PostgreSQL database (available only with `EF Core`).
- **REST API** - controllers for exposing business services via REST API.
  - *Project* - the name of the project to use.
- **WCF API** - business services exposed via legacy WCF API.
  - *Project* - the name of the project to use.

We will describe the details of each project in the [next section](solution-structure). Normally, you can just stick to the default configuration for most components and then click the *Create* button to create your solution.
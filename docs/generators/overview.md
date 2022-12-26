---
sidebar_position: 0
sidebar_label: "Overview"
pagination_prev: null
---

# Xomega Generators

Currently, Xomega.Net is geared towards the Microsoft technology stack:

- **SQL Server** database for the persistence layer;
- **Entity Framework Core** or **Entity Framework 6.x** for the domain model and ORM;
- Service layer in C# that can be exposed through **Web API** (REST) or **WCF** (SOAP);
- C#-based presentation layer for modern **Blazor Server** or **Blazor WebAssembly** web app, or classic **ASP.NET WebForms** or **WPF** desktop apps, powered by our open-source Xomega Framework that helps you build robust multi-tier applications faster and with less code.
- TypeScript-based presentation layer for **HTML5** Single Page Applications (**SPA**) powered by our open-source XomegaJS counterpart of the Xomega Framework for TypeScript SPAs.

Xomega comes with a set of built-in generators that can help you hit the ground running with the Xomega platform. These generators are listed below grouped by the type of output or the layer that they generate.

## Model enhancement generators{#model}

This type of generator helps you quickly enrich your XML object model by importing it from a database, or by adding new layers or aspects to the model.

- [Import from Database](model/import) creates an object model from your existing SQL Server database schema.
- [Full CRUD with Views](model/crud) allows you to quickly add configurable `create`, `update`, `read`, `delete` and `read list` operations to any object and its sub-objects in the model, as well as to define and configure any necessary data objects and views in the model for UI generation.
- [Enumerations from Database](model/enums) imports static enumerations and their values into the model from existing database tables.

## Data layer generators{#data}

These generators create Entity Framework Entities or EDM for ORM and produce DDL scripts that help you build or update your database from the object model.

- [EF Domain Objects](data/entities) generates Entity Framework classes for domain objects, `DbContext`, and entity configurations using Fluent API.
- [Entity Data Model](data/edm) generates an Entity Data Model to graphically view domain objects on a single or multiple diagrams.
- [Database Schema](data/schema) generates a DDL script for your database if you start building your model from scratch.
- [Database Change Script](data/migration) generates a rerunnable DDL update script that will make incremental changes to your existing database to bring it in synch with the object model.

## Service layer generators{#svc}

These generators allow you to rapidly generate service and data contracts, customizable service implementations, as well as artifacts that help you expose your services via WCF or Web API.

- [Service Contracts](services/contracts) generates service and data contracts based on the model operations and structures, which can be WCF-enabled.
- [Service Implementations](services/service-impl) generates customizable implementations for the services using the EDM and LINQ to Entities.
- [WCF Service Configurations](services/wcf-config) adds WCF endpoint and service configurations to the server-side config file.
- [WCF Service Host Files](services/wcf-host) generates service host files (`.svc`) for hosting WCF services in IIS.
- [Web API Controllers](services/web-api) creates RESTful endpoints for the generated services.

## Presentation layer generators{#ui}

These generators allow you to create UI views and any supporting classes for both web and desktop clients following MVVM architecture.

### Blazor

- [Blazor Views](presentation/blazor/views) generates Razor and C# code for Blazor views and the main menu structure.
- [Syncfusion Blazor Views](presentation/blazor/views-xsf) generates Razor and C# code for Blazor views and the main menu structure using Syncfusion components.

### Common

- [Xomega Data Objects](presentation/common/data-objects) generates reusable presentation data objects based on Xomega Framework, which serve as an integral part of the view models.
- [View Models](presentation/common/view-models) generates platform-independent view model classes based on Xomega Framework that the views can be attached to.
- [Label Resources](presentation/common/resources) generates a resource file with labels and titles for data properties, data objects and views declared in the model.
- [REST Service Clients](presentation/common/rest-clients) generates C# service proxies that call REST services, and can be registered with the DI container.
- [WCF Client Configuration](presentation/common/wcf-config) adds WCF endpoint configurations to the client-side config file.

### SPA{#uits}

- [SPA Views](presentation/spa/views) generates HTML5 views and TypeScript view models based on the model definitions.
- [XomegaJS Data Objects](presentation/spa/data-objects) generates TypeScript presentation data objects based on the XomegaJS framework, which serve as an integral part of the view models.
- [TS Service Contracts](presentation/spa/contracts) generates TypeScript service and data contract classes for RESTful API calls.
- [TS Lookup Cache Loaders](presentation/spa/cache-loaders) generates TypeScript classes for loading custom lookup cache data.
- [TS Enumeration Constants](presentation/spa/enum-const) generates TypeScript constants for each enumeration item to allow referring to individual items in the client code without hardcoding the values.

### Web Forms

- [ASP.NET Views](presentation/webforms/views) generates ASP.NET WebForms views based on the model definitions and adds them to the main menu in the Web.sitemap file.

### WPF

- [WPF Views](presentation/wpf/views) generates XAML and C# code for WPF views and the main menu resources.

## Static data generators{#static}

These generators help you use the static enumerations defined in your model both in runtime and design time by generating the necessary artifacts.

- [Lookup Cache Loaders](enums/cache-loaders) allows you to quickly generate loaders of the lookup cache, which is used to populate selection lists and to decode values, from a database using the corresponding service operation.
- [Enumeration Constants](enums/enum-const) generates constants for each enumeration item to allow referring to individual items in the code.
- [Enumeration Data XML](enums/enum-xml) generates an XML file that can be used for runtime lookups and value lists from the model enumerations.
- [Enumeration Reload SQL](enums/enum-sql) generates a SQL script for (re)loading enumerations into the database tables to allow using them in the database layer.

## Documentation generators{#doc}

These generators create customizable professional Microsoft Word technical design documents for the system based on your Xomega model.

- [Domain Model Design](docs/domain-model) creates a design document that describes domain model architecture and the full structure of each domain object grouped by module.
- [Service Model Design](docs/service-model) creates a design document that describes service model architecture and the full structure of each service grouped by module.
- [Static Data Design](docs/static-data) creates a design document that describes static data architecture and the full description of each enumeration grouped by module.
- [SQLXML Report](docs/sqlxml) generates a generic custom document using provided template and data returned by an SQLXML query.

## Custom generators{#custom}

In addition to the standard generators, the Full Edition of Xomega.Net allows you to develop your own custom generators, as described [here](custom).

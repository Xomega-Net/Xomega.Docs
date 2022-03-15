---
sidebar_position: 0
sidebar_label: Overview
pagination_prev: null
---

# Xomega.Net for Visual Studio

Xomega.Net is a Visual Studio extension that provides an integrated environment for browsing and editing your Xomega models with a powerful Xomega Editor, as well as for configuring and running generators of application artifacts from your models.

## Xomega solution wizard

To help you quickly create and configure a Xomega solution for your technology stack, Xomega.Net provides a solution wizard that lets you pick and configure the technologies for your solution, and generates the initial solution structure using industry best practices for the selected system architecture.

## Xomega project system

Xomega project system supports a new Visual Studio project type `.xomproj`, which allows you to create and maintain a Xomega model for your application, organized as a set of individual model files rather than as one large XML file.

The Xomega project is based on MSBuild, and allows you to run model validations and custom generators that you can dynamically define and configure within the project.

## Xomega generators

Xomega.Net comes with a number of configurable standard generators that help you quickly build artifacts for all layers of your application. There are generators for various modern and legacy .NET technologies, such as Blazor, WPF, WebForms, WCF and even TypeScript.

With its extensible architecture, it also allows you to plug in your own custom generators to generate your own artifacts the way you need it.

## Xomega editor service

Working with large models directly in XML could be a challenging task. Therefore Xomega.Net includes a powerful Xomega Editor that makes editing, browsing and navigating XML models extremely easy with support of such features as:

- **Enhanced IntelliSense** - suggests allowed values both from the schema and those defined in the model itself.
- **Custom Validations** - underlines invalid values as you type and displays the errors in the *Error List* window.
- **Go To Definition** - takes you to the definition of model entities (e.g. types) from the places where they are referenced.
- **Find All References** - displays all model references to the current entity (e.g. type).
- **Renaming** - allows renaming model entities and updates all references to them.
- **Symbol Browsing** - allows browsing the model via standard VS tools such as Object Browser or Class Viewer.
- **Collapsing to Definitions** - allows collapsing to model definitions with a single click for ease of XML browsing.
- **User-friendly Outlining** - improves standard VS XML outlining for readability.

As a result, Xomega.Net makes working with XML models no harder than writing code in any of the other modern languages.

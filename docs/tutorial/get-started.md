---
sidebar_position: 1
sidebar_label: Get started
pagination_prev: null
---

# Step-by-step Xomega tutorial

The best way to understand the capabilities of our low-code platform, and appreciate the speed of the application development it provides, is to walk through a process of building a fully fledged end-to-end application from scratch.

In this tutorial we will show you how to build rich web and desktop applications from a sample Microsoft database AdventureWorks. This database covers many facets of an enterprise information system for a mid-size company from HR and procurement to production and sales. We will show you how to build a sample application for the Sales module on top of that database.

You will see how Xomega.Net helps you get off the ground quickly with its solution template that allows you to create your custom architecture  using industry best practices. In this tutorial we will create a Blazor solution for both WebAssembly and Blazor Server technologies, and then will model our application, tailoring it to our specific requirements.

From there you will generate most of the application code and artifacts right from the model, and then you will add security, and any necessary customizations for the generated code.

## Before you start

To run this tutorial you will need to make sure you have the following installed on your machine:
1. Visual Studio 2019 Community Edition or higher with TypeScript support and the latest updates.
1. Xomega.Net plug-in for your version of Visual Studio.
1. Valid Xomega license.
1. Sample Microsoft database [AdventureWorks](https://github.com/Microsoft/sql-server-samples/releases/tag/adventureworks) installed on your local or network SQL server. See [instructions](https://github.com/Microsoft/sql-server-samples/blob/master/samples/databases/adventure-works/README.md#install-from-a-backup) on how to restore it from a backup.

:::caution
This tutorial is based on [version 2016](https://github.com/Microsoft/sql-server-samples/releases/download/adventureworks/AdventureWorks2016.bak) of AdventureWorks database.
If you use a different version of the database, you may see some differences from this tutorial.
:::

:::tip
The complete final code for this tutorial is also available on [GitHub](https://github.com/Xomega-Net/Xomega.Examples), so you can always download and run it, and use it as a reference when walking through the steps.
:::

Without further ado, let's get started by creating a solution for our application projects, and generating some basic search and details views out of the box.

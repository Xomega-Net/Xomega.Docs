---
sidebar_position: 4
---

# SQLXML Report

This generator allows generating of custom database-driven MS Word documents and reports from a template document using a generic Xomega document generation engine.

It may be useful for producing project-specific technical documentation from structured data stored in the database, as well as generic reports, such as inventories, price lists, etc.

The generated document is based on a customizable Word template that you can update to change the look-and-feel, the static content, and the way dynamic content is added.

## Generator inputs

The input data comes from an SQLXML query that you supply in the generator's properties. The XML elements and attributes returned by that query can be used in the document template to select the data that needs to be displayed in each Content Control.

## Generator outputs

This generator creates a Microsoft Word document with the formatted data at the specified path.

## Configuration

The following sections describe the configuration parameters used by the generator.

### Generator parameters

The following table lists configuration parameters that are set as the generator’s properties.

|Parameter|Value Example|Description|
|-|-|-|
|Generator Name|SQLXML Report|The name of the current configuration of the generator that will appear in the model project and the build output.|
|Folder Name|Documentation|Folder path to the generator inside the Model project. The folders are separated by a backslash (\\).|
|Include In Build|False|A flag indicating whether or not running this generator should be included in building of the model project.|
|Document Template|..\Templates\ReportTemplate.docx|Path to the MS Word document that will be used as a template for the generated document.|
|**Output**|
|Output Path|../Docs/SqlXmlReport.docx|Relative path where to output the generated document.|
|**Database**|
|Database|SQL Server|Database type of the target database. Currently only SQL Server (`sqlsrv`) is supported. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Version|11.0|The version of the target database. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Case|CamelCase|The database case for the database objects' names: `UPPER_CASE`, `lower_case` or `CamelCase`. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Database Connection|Use Project Settings|Database connection string for the target database. Edited via a *Database Connection Configuration* dialog, which also sets the other *Database* parameters of the generator, and allows saving all this configuration for the entire project. Value '*Use Project Settings*' takes this value from the corresponding property of the model project.|
|Sql Query|SELECT ... FOR XML ..., TYPE, ROOT('root')|SQL query that returns rooted typed XML using `FOR XML`, `TYPE` and `ROOT` directives.|
|**Parameters**|
|Title|SQLXML Report|Title to use for the generated document.|
|Subject|Custom report generated from SQL XML|Subject (subtitle) to use for the generated document.|
|Creator|[User]|Creator (author) of the generated document. Value `[User]` indicates the user of the current Xomega license.|
|Company|[Company]|Company to use for the generated document. Value `[Company]` indicates the company of the current Xomega license.|

### Model configuration

The generator doesn't use any other global configurations in the model.

### Common configurations

You can have multiple configurations of this generator to create multiple types of DB data-driven reports using different SQL queries for the data, different document templates, and the generator's parameters.

## How to use the generator

The sections below provide some details on how to work with the generator.

### Running the generator

To run this generator you need to select it in the model project, and then select *Generate* menu from either the context menu or the top-level *Project* menu.

:::warning
After you generate the document, you may need to open it and refresh all fields there, such as the table of contents, by selecting all text (Ctrl+A) and pressing F9.
:::

### Customizing the output

:::danger
You should never edit the generated document directly to avoid losing your changes when you rerun the generator.
:::

Instead, you should update the MS Word template that is used to create the document or make changes in the data or generator's parameters.

### Cleaning the generator’s output

The generator doesn't support a *Clean* operation, since the entire document is regenerated when you rerun the generator.

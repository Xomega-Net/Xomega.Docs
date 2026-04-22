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

By default, the generator configuration is defined under the `.Generators\Documentation` folder in the model project as follows.

```xml title="Custom SqlXml Report.xgen"
<XomGeneratorConfig xmlns="http://schemas.xomega.net/v10/xgen"
                    xmlns:doc="http://schemas.xomega.net/v10/xgen/docx">

  <Generator Xsl="Docs/docx_sqlxml.xsl"
             DbConnectionNeeded="true"
             DbTimeout="30"/>
  
  <doc:Output Path="../Docs/SqlXmlReport.docx"/>

  <!-- a sample template for the custom report showing a list of database tables -->
  <doc:Document Template=".Generators/Documentation/Templates/CustomReport.docx"
                Title="SQL XML Report"
                Subject="Custom report using SQL XML data"
                Creator="[User]"
                Company="[Company]"/>

  <doc:DataSource>
    <!-- a sample query for a list of DB tables and their columns -->
    <doc:SqlXmlQuery>
      select tbl.TABLE_SCHEMA + '.' + tbl.TABLE_NAME [@name],
          (select value from fn_listextendedproperty('MS_Description', 'schema', tbl.TABLE_SCHEMA,
          'table', tbl.TABLE_NAME, NULL, NULL)) [@description],
          (select c.COLUMN_NAME [@name], c.DATA_TYPE + case
              when (c.DATA_TYPE in ('decimal', 'numeric')
              and (c.NUMERIC_PRECISION != 38 or c.NUMERIC_SCALE != 0))
              then '(' + cast(c.NUMERIC_PRECISION as varchar)+ ',' + cast(c.NUMERIC_SCALE as varchar) + ')' 
              when (c.DATA_TYPE = 'float' and c.NUMERIC_PRECISION != 53)
              then '(' + cast(c.NUMERIC_PRECISION as varchar) + ')' 
              when (c.DATA_TYPE like '%char%') then '(' + case when c.CHARACTER_MAXIMUM_LENGTH > 0
                  then cast(c.CHARACTER_MAXIMUM_LENGTH as varchar) else 'max' end + ')' 
              else '' end [@type],
              kcu.ordinal_position [@key],
              case c.IS_NULLABLE when 'NO' then 'true' else null end [@required],
              (select value from fn_listextendedproperty('MS_Description', 'schema', tbl.TABLE_SCHEMA,
              'table', tbl.TABLE_NAME, 'column', c.COLUMN_NAME)) [@description]
          from INFORMATION_SCHEMA.COLUMNS c
          left join INFORMATION_SCHEMA.TABLE_CONSTRAINTS pkc
              on pkc.TABLE_SCHEMA = c.TABLE_SCHEMA and pkc.TABLE_NAME = c.TABLE_NAME
              and pkc.CONSTRAINT_TYPE = 'PRIMARY KEY'
          left join INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
              on kcu.TABLE_SCHEMA = c.TABLE_SCHEMA and kcu.TABLE_NAME = c.TABLE_NAME
              and kcu.COLUMN_NAME = c.COLUMN_NAME and kcu.CONSTRAINT_NAME = pkc.CONSTRAINT_NAME
          where c.TABLE_SCHEMA = tbl.TABLE_SCHEMA and c.TABLE_NAME = tbl.TABLE_NAME
          order by c.ORDINAL_POSITION
          for xml path('column'), type)
      from INFORMATION_SCHEMA.TABLES tbl 
      where TABLE_TYPE = 'BASE TABLE'
      order by tbl.TABLE_SCHEMA, tbl.TABLE_NAME
      for xml path('table'), type, root('schema')
    </doc:SqlXmlQuery>
  </doc:DataSource>

</XomGeneratorConfig>
```

### Generator parameters

The following table describes configuration parameters for the generator.

|Parameter|Value Example|Description|
|-|-|-|
|Xsl|Docs/docx_model.xsl|Relative path to the XSLT file used by the generator to generate the Word document.|
|DbConnectionNeeded|true|Indicates that the generator needs a database connection to run. If `true`, then the generator will prompt you to select a connection string from the list of connections defined in the model project, or to create a new one.|
|DbTimeout|30|Specifies the timeout in seconds for the database connection.|
|**doc:Output**|
|Path|../Docs/SqlXmlReport.docx|Relative path where to output the generated document.|
|**doc:Document**|
|Template|.Generators/Documentation /Templates/CustomReport.docx|Path to the MS Word document that will be used as a template for the generated document. The path is relative to the model project.|
|Title|SQL XML Report|Title to use for the generated document.|
|Subject|Custom report using SQL XML data|Subject (subtitle) to use for the generated document.|
|Creator|[User]|Creator (author) of the generated document. Value `[User]` indicates the user of the current Xomega license.|
|Company|[Company]|Company to use for the generated document. Value `[Company]` indicates the company of the current Xomega license.|
|**doc:Datasource**|
|`doc:SqlXmlQuery`|SELECT ... FOR XML ..., TYPE, ROOT('root')|SQL query that returns rooted typed XML using syntax appropriate for the current database, e.g. `FOR XML`, `TYPE` and `ROOT` directives.|

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

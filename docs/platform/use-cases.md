---
sidebar_position: 2
sidebar_label: Xomega Use Cases
pagination_label: How can I use Xomega
---

# How can I use Xomega?

Xomega platform is best suited for quickly building standardized data-driven .NET applications that allow browsing and editing structured data from a relational database.

The savings from Xomega code generation and from standardization are significantly multiplied if you are building large-scale enterprise line-of-business applications where the users need to work with a lot of different data screens. Normally, building and evolving such applications using traditional tools require substantial time and effort, especially while maintaining high code quality, and Xomega can cut that down to the minimum.

Check out the following use cases, and make sure to let us know which one you are interested in the most. 

## Prototyping a brand-new app

If you are building a brand new "green field" app, and need to create a quick prototype that you can easily review with the users and other stakeholders, then you can use the Xomega solution wizard to create initial projects for your app, throw together an initial model for your domain objects, add service operations to them, and generate working screens using default Xomega settings in no time.

Instead of using static screen mockups, you can review the data elements in your prototype using dynamic live screens, which can help the users get a better feel for the app and get the design right in order to avoid costly reworks later. If you stay focused initially on the data elements and refrain from manually changing the generated views, you will be able to iterate continuously by tweaking your Xomega model and regenerating all the code until you get everything right.

By the time you finish reviewing your prototype, you will already have a working application with established domain and service models. All you'll have to do is implement any customizations that are unique to your specific application or develop any pieces that are not readily available in the generated code or in the Xomega Framework.

## Building out a Blazor app{#build}

Once you have created the structure of your models, you can refactor and refine them, create and configure proper logical types, and add documentation to the model elements. This will allow you to generate technical design docs from the model, which you can then review with system architects, developers, DBAs, or any other technical stakeholders. The best thing is that you can always regenerate these docs later, which will keep you with always up-to-date technical documentation.

In order to create unique branding for your Blazor app, you can modify the default site layout that came with the project template, tweak the look and feel using custom CSS stylesheets, or substitute standard Xomega Framework components with your custom ones.

Xomega provides many ways to customize the look and behavior of your application both directly in the model and by writing custom C# code, such that you can always regenerate all your artifacts without losing your customizations. If, however, you still need the generated code or markup to look slightly different, e.g., have the generated classes extend your custom base class, or lay out the generated views differently, then you also have the option to modify the generators' source code to output things the way you want.

Finally, you can enhance the Xomega model structure to capture additional model elements, e.g., security privileges tied to the operations and fields, and update the generators to leverage those elements during the generation process. For the ultimate custom development experience, you can add your own new generators that can generate new types of artifacts, such as unit tests, in order to further streamline and simplify your development process.

So, with Xomega openness and extensibility, the sky is the limit on what you can achieve for your app development.

## Modernizing a legacy app

If you have an old legacy application, such as a mainframe monolith, and are looking to completely modernize it by rewriting it with .NET, then you will need to recreate the domain model from the existing database structure and define appropriate service operations and UI objects based on the existing screens.

:::tip
To help you with this process, Xomega allows you to import your domain model from the structure of your existing database.
:::

Once you have the models created and configured, you can generate the code for your Blazor app and follow the same customization techniques as the ones we described earlier for [building Blazor apps](#build).

## Adding to a legacy .NET app

If you have an existing legacy ASP.NET Web Forms or a WPF application for which you still need to develop new modules, you may want to consider developing those using the Xomega platform. This will provide you with the following immediate as well as long-term benefits.
- You can safely learn the Xomega technology and framework without jumping all in on it.
- You will save on development efforts by generating Web Forms or WPF views and all the backing code directly from the model.
- With more Xomega experience, you'll be able to refactor other existing modules of your application to use Xomega.
- Once you switch over to the platform-independent logic with Xomega for your legacy app, you'll be able to easily migrate it to the latest .NET technologies, such as Blazor or even MAUI.

If you don't need to add any new modules but are still interested in migrating your app to the latest Microsoft technologies, you can just start building it out as a Blazor app with Xomega, as we described [earlier](#build).

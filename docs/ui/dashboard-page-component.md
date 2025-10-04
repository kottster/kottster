---
description: "DashboardPage component in Kottster displays dynamic dashboards with statistics and charts."
---

# DashboardPage component

The `DashboardPage` component displays a dynamic dashboard with various statistics, charts, and data visualizations.

The component is tightly connected to the [`dashboard page configuration`](../dashboard/configuration/api.md) and backend API. You need to modify the `DashboardPage` component if you want extra control over **how the dashboard looks or works on the client side**.


## Properties

- ### title

  `string`, optional

  The title displayed at the top of the page. If not provided, the [navigation item name](../app-configuration/sidebar.md) will be used as the default.

- ### headerRightSection

  `ReactNode`, optional

  A custom component displayed on the right side of the page header.

- ### headerBottomSection

  `ReactNode`, optional

  A custom component displayed below the page header.

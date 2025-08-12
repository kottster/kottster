---
description: "DashboardPage component in Kottster displays dynamic dashboards with statistics and charts."
---

# DashboardPage component

The `DashboardPage` component displays a dynamic dashboard with various statistics, charts, and data visualizations.

The component is tightly connected to the [`defineDashboardController`](../dashboard/configuration/api.md) settings, which manage both API interactions and dashboard behavior. If you want extra control over **how the dashboard looks or works on the client side**, you need to use the `DashboardPage` component.


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

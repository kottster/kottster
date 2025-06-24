---
description: "Page component for displaying content with a title and custom sections."
---

# Page component

The `Page` component displays a simple page with a title and content.


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

- ### children

  `ReactNode`, optional

  The content of the page passed as children. This can be any valid React element.
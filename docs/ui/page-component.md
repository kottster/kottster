---
description: "Page component for displaying content with a title and custom sections."
---

# Page component

The [`Page`](https://kottster.app/api-reference/interfaces/_kottster_react.PageProps.html) component displays a simple page with a title and content.


## Basic usage

**Example:**

```jsx [app/pages/myCustomPage/index.jsx]
import { Page } from '@kottster/react';

export default () => (
  <Page title='About Us'>
    Hello, this is the content of the page.
  </Page>
);
```

## Properties

- ### title

  `string`, optional

  The title displayed at the top of the page. If not provided, the [navigation item name](../app-configuration/sidebar.md) will be used as the default.

- ### children

  `ReactNode`, optional

  The content of the page passed as children. This can be any valid React element.

- ### withHeader

  `boolean`, optional

  A boolean indicating whether to display the page header. Defaults to `true`.

- ### headerRightSection

  `ReactNode`, optional

  A custom component displayed on the right side of the page header.

- ### headerBottomSection

  `ReactNode`, optional

  A custom component displayed below the page header.

- ### children

  `ReactNode`, optional

  The content of the page passed as children. This can be any valid React element.

- ### maxContentWidth

  `number`, optional

  The maximum width of the dashboard content area. This can be specified in pixels.
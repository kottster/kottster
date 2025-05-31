---
sidebar_position: 1
---

# Customize columns

There are many ways to customize existing columns in the table.

## On the client side

**Using the `columnOverrides` in the `TablePage` component**

If you want to update the displaying of existing columns, you can use the [`columnOverrides`](/table/table-page-component#columnoverrides) prop. This is useful for adding custom render functions.

Add the `columnOverrides` prop to the `TablePage` component. This prop accepts an object where each key is the column name and the value is a function that takes the existing column configuration and returns the modified column configuration.

**Example of a page with a modified column:**

```jsx title="app/pages/users/index.jsx"
import { TablePage } from '@kottster/react';

export default () => (
  <TablePage
    columnOverrides={{
      // Modifying the email column
      email: column => ({
        ...column,

        // The custom display label for the column
        label: 'Email address',

        // Optional render function to display the column content
        render: ({ email }) => <a href={`mailto:${email}`}>{email}</a>,
      }),
    }}
  />
);
```

Learn more about **columns and their parameters** in the [API reference](/table/configuration/api#columns-1).
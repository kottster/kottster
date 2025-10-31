---
description: "Add custom columns to Kottster table pages to display additional data, or modify existing columns with custom render functions."
---

# Custom columns

## Add new columns to the table

Add the [`customColumns`](../../ui/table-page-component.md#customcolumns) prop to the [`TablePage`](../../ui/table-page-component.md) component. This prop accepts an array of objects, each representing a custom column.

**Example of a page with a custom column:**

```jsx [app/pages/users/index.jsx]
import { TablePage } from '@kottster/react';

export default () => (
  <TablePage
    customColumns={[
      // Add a custom column to the table
      {
        // The unique key for the new column
        column: 'fullName',

        // The display label for the column
        label: 'Full name',

        // Position of the column, if not specified, it will be added to the end
        position: 1,

        // Render function to display the column content
        render: (record) => (
          `${record.first_name} ${record.last_name}`
        ),
      },
    ]}
  />
);
```

## Modify render for existing columns

Add the [`columnOverrides`](../../ui/table-page-component.md#columnoverrides) prop to the [`TablePage`](../../ui/table-page-component.md) component. This prop accepts an object where each key is the column name and the value is a function that takes the existing column configuration and returns the modified column configuration.

**Example of a page with a modified column:**

```jsx [app/pages/users/index.jsx]
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
        render: (record) => (
          <a href={`mailto:${record.email}`}>
            Send email to {record.email}
          </a>
        ),
      }),
    }}
  />
);
```
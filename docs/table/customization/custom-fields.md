---
description: "Add custom fields to Kottster table pages to enhance data management. Learn how to create custom columns and render components in forms."
---

# Custom fields

In Kottster, **all fields are basically table columns**. If you need to add  or modify fields in the table pages, you can do so by modifying or adding custom columns.

## Add new fields to the form

Add the [`customColumns`](../../ui/table-page-component.md#customcolumns) prop to the [`TablePage`](../../ui/table-page-component.md) component. This prop accepts an array of objects, each representing a custom column.

**Example of a page with a custom field:**

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
        formFieldPosition: 1,

        // Hide the column in the table view since it's only for the form
        hiddenInTable: true,

        fieldInput: {
          type: 'custom',

          // Render component function
          renderComponent: ({ record }) => {
            return (
              <input 
                type='text'
                placeholder='Enter full name'
                value={`${record.first_name || ''} ${record.last_name || ''}`}
                onChange={(e) => {
                  const values = e.target.value.split(' ');

                  updateFieldValue('first_name', values[0] || '');
                  updateFieldValue('last_name', values[1] || '');
                }}
              />
            )
          },
        },
      },
    ]}
  />
);
```

## Modify field input for existing columns

Add the [`columnOverrides`](../../ui/table-page-component.md#columnoverrides) prop to the [`TablePage`](../../ui/table-page-component.md) component. This prop accepts an object where each key is the column name and the value is a function that takes the existing column configuration and returns the modified column configuration.

**Example of modifying email field:**

```jsx [app/pages/users/index.jsx]
import { TablePage } from '@kottster/react';

export default () => (
  <TablePage
    columnOverrides={{
      // Modifying the field input of the email column
      email: column => ({
        ...column,

        // The custom display label for the column
        label: 'Email address',

        // The custom field input
        fieldInput: {
          type: 'custom',
          renderComponent: (params) => {
            const { value, updateFieldValue } = params;

            return (
              <input 
                type='email'
                placeholder='Enter email'
                value={value} 
                onChange={(e) => updateFieldValue('email', e.target.value)} 
              />
            )
          },
        }
      }),
    }}
  />
);
```
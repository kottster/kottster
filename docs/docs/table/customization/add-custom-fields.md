---
sidebar_position: 2
---

# Add custom fields

In Kottster, **all fields are basically table columns**. If you need to add custom fields to the form, you need to add custom columns to the table configuration.

## On the client side

**Using the `customColumns` in the `TablePage` component**

If you want to display a new field in the form, you can use the [`customColumns`](/table/table-page-component#customcolumns) prop. This is useful for adding additional fields without modifying the existing columns or backend logic.

Add the `customColumns` prop to the `TablePage` component. This prop accepts an array of objects, each representing a custom column.

```tsx title="Example of a custom column"
{
  // The unique key for the new column
  column: 'fullName',
  
  // The display label for the column
  label: 'Full name',
  
  // Position of the column, if not specified, it will be added to the end
  position: 1,

  // If you want to hide the column in the table, set this to true
  // This is useful for columns (fields) that should only be used in the form
  hiddenInTable: true,

  fieldInput: {
    type: 'custom',

    // Render component function
    renderComponent: ({ record }) => {
      return record ? (
        <a 
          href={`https://example.com/posts/${record?.id}`} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          Open post
        </a>
      ) : (
        <span>Create a post to see the link</span>
      )
    },
  },
}
```

Learn more about `fieldInput` and its parameters in the [API reference](/table/configuration/api#field-inputs).

```tsx title="Example of a page with a custom column"
import { TablePage } from '@kottster/react';
import { app } from '../../.server/app';
import dataSource from '@/.server/data-sources/mysql';
import pageSettings from './settings.json';

export const action = app.defineTableController(dataSource, {
  ...pageSettings,
});

export default () => (
  <TablePage
    customColumns={[
      // Add a custom column to the table
      {
        column: 'fullName',
        label: 'Full name',        
        position: 1,
        hiddenInTable: true,
        fieldInput: {
          type: 'custom',
          renderComponent: ({ record }) => {
            return record ? (
              <a 
                href={`https://example.com/posts/${record?.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Open post
              </a>
            ) : (
              <span>Create a post to see the link</span>
            )
          },
        },
      },
    ]}
  />
);
```

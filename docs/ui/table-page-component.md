---
description: "Table page component for displaying and managing data with search, sorting, and custom actions."
---

# TablePage component

The `TablePage` component displays a dynamic table for viewing and managing data from a database table. It includes features like search, sorting, filtering, and a form for inserting or updating records.

The component is tightly connected to the [table page configuration](../table/configuration/api.md) and backend API. You need to modify the `TablePage` component if you want extra control over **how the main table looks or works on the client side**.

## Basic usage

### Configuring the main table

**Example:**

```jsx [app/pages/users/index.jsx]
import { TablePage } from '@kottster/react';

export default () => (
  <TablePage
    // Configuration here
    customColumns={[
      {
        column: 'fullName',
        label: 'Full name',
        position: 1,
        render: ({ first_name, last_name }) => `${first_name} ${last_name}`,
      },
    ]}
  />
);
```

### Configuring nested tables

You can also configure nested tables by setting the `nested` property in the `TablePage` component.

**Example:**

```jsx [app/pages/users/index.jsx]
import { TablePage } from '@kottster/react';

export default () => (
  <TablePage
    // Configuration props for the main table
    customColumns={[
      {
        column: 'fullName',
        label: 'Full name',
        position: 1,
        render: ({ first_name, last_name }) => `${first_name} ${last_name}`,
      },
    ]}
    nested={{
      orders__p__user_id: {
        // Configuration props for the nested table
        customColumns: [
          {
            column: 'orderTitle',
            label: 'Order Title',
            position: 1,
            render: ({ id, title }) => `${id}. ${title}`,
          },
        ],
      },
    }}
  />
);
```

## Properties

- ### title

  `string`, optional

  The title displayed at the top of the page. If not provided, the [navigation item name](../app-configuration/sidebar.md) will be used as the default.

- ### columns

  `TableColumn[]`, optional

  Learn more: [Columns](../table/configuration/api.md#columns-1)

- ### customColumns

  `TableColumn[]`, optional

  An array of custom columns to be added to the table. These columns will be merged with the automatically determined columns.

  Learn more: [Columns](../table/configuration/api.md#columns-1)

- ### customActions

  `TableAction[]`, optional

  An array of custom actions to be added as buttons in the table. These actions can be used to perform custom logic on records.

  **Contains the following properties**:

  - `label`: The label of the action button.
  - `onClick`: A function that will be called when the action button is clicked. It receives the current record as an argument.
  - `procedure`: A string representing the name of a server procedure to be called when the action button is clicked. The procedure will be executed automatically, and you can handle the result using the `onResult` callback.
  - `onResult`: A function that will be called with the result of the server procedure. It receives the result object as an argument.

- ### customBulkActions

  `TableBulkAction[]`, optional

  An array of custom bulk actions to be added to the table. These actions can be used to perform custom logic on multiple records at once. They will appear if the user selects one or more records in the table.

  **Contains the following properties**:

  - `label`: The label of the bulk action button.
  - `onClick`: A function that will be called when the bulk action button is clicked. It receives an array of selected records as an argument.
  - `procedure`: A string representing the name of a server procedure to be called when the bulk action button is clicked. The procedure will be executed automatically, and you can handle the result using the `onResult` callback.
  - `onResult`: A function that will be called with the result of the server procedure. It receives the result object as an argument.
  - `disableSelectionReset`: A boolean indicating whether the selection should be reset after the bulk action is executed. Defaults to `false`.

- ### columnTransformer

  `(columns: TableColumn[]) => TableColumn[]`, optional

  A custom function used to transform the automatically determined columns.

  ```typescript [Example]
  columnTransformer: columns => [
    ...columns,
    {
      column: 'full_name',
      label: 'Full name',
      render: (record) => `${record.first_name} ${record.last_name}`,
      position: 1,
    },
  ]
  ```

- ### columnOverrides

  `Record<string, TableColumn | ((column: TableColumn) => TableColumn)>`, optional

  A custom object used to override the automatically determined columns.

  ```typescript [Example]
  columnOverrides: {
    // Full replacement of the email column
    email: { 
      column: 'email',
      label: 'Email address' 
    },

    // Adjustment of the post_key column
    post_key: column => ({
      ...column,
      label: 'Post Key',
      render: (record) => record.name.toUpperCase(),
    }),
  }
  ```

- ### withSearch

  `boolean`, optional

  If `true`, enables the search functionality in the table. The search input will be displayed above the table, allowing users to filter records based on their input.

  By default, it's turned on automatically if there are searchable columns defined in the table controller.

- ### form

  Contains the configuration for the form for viewing, inserting, and updating records.

  - #### width

    `number`, optional

    The width of the form (in pixels).

- ### headerRightSection

  `ReactNode`, optional

  A custom component displayed on the right side of the page header.

- ### headerBottomSection

  `ReactNode`, optional

  A custom component displayed below the page header.

- ### nested

  An object that defines properties for nested tables. Each key in this object corresponds to a nested table configuration.

  Each nested table configuration has all the properties of a regular table configuration.
---
sidebar_position: 4
---

# TablePage component

The `TablePage` component displays a dynamic table for viewing and managing data from a database. It includes features like search, sorting, filtering, and a form for inserting or updating records.

The component is tightly connected to the [`defineTableController`](/table/configuration/api) settings, which manage both API interactions and table behavior. If you want extra control over **how the main table looks or works on the client side**, you need to use the `TablePage` component.


## Properties

- ### title

  `string`, optional

  The title displayed at the top of the page. If not provided, the nav item label will be used as the default.

- ### columns

  `TableColumn[]`, optional

  Learn more: [Columns](/table/configuration/api#columns-1)

- ### customColumns

  `TableColumn[]`, optional

  An array of custom columns to be added to the table. These columns will be merged with the automatically determined columns.

  Learn more: [Columns](/table/configuration/api#columns-1)

- ### columnTransformer

  `(columns: TableColumn[]) => TableColumn[]`, optional

  A custom function used to transform the automatically determined columns.

  ```typescript
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

  ```typescript title="Example"
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

- ### form

  Contains the configuration for the form for viewing, inserting, and updating records.

  - #### width

    The width of the form (in pixels).

- ### headerRightSection

  A custom component displayed on the right side of the page header.

- ### headerBottomSection

  A custom component displayed below the page header.

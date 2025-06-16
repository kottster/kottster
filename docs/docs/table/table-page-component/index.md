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

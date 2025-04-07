---
sidebar_position: 1
---

# Add custom columns

There are many ways to add custom columns to the table. 

## Using the `columnTransformer`

If you want to add a new column to existing columns, you can use the [`columnTransformer`](/table/table-page-component#columntransformer) prop.  

```jsx title="Example of adding a full name column"
export default () => (
  <TablePage
    columnTransformer={columns => ([
      ...columns,

      // New column for displaying the full name
      {
        // The column key
        column: 'fullName',
        
        // The display column name
        label: 'Full name',
        
        // Position of the column, if not specified, it will be added to the end
        position: 1,

        // Render function to display the column content
        render: ({ first_name, last_name }) => `${first_name} ${last_name}`,
      },
    ])}
  />
);
```

You can learn more about the available column configurations on the [TablePage Component](/table/table-page-component#columns-1) page.

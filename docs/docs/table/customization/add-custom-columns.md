---
sidebar_position: 1
---

# Add custom columns

There are many ways to add custom columns to the table. 

## Using the `customColumns`

If you want to add a new column to existing columns, you can use the [`customColumns`](/table/table-page-component#customcolumns) prop.  

```tsx title="Example of adding a full name column"
export default () => (
  <TablePage
    customColumns={[
      // New column for displaying the full name
      {
        // The unique key for the new column
        column: 'fullName',
        
        // The display label for the column
        label: 'Full name',
        
        // Position of the column, if not specified, it will be added to the end
        position: 1,

        // Render function to display the column content
        render: ({ first_name, last_name }) => `${first_name} ${last_name}`,
      },
    ]}
  />
);
```

Learn more about **columns and their parameters** in the [API reference](/table/configuration/api#columns-1).

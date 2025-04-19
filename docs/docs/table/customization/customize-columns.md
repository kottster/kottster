---
sidebar_position: 1
---

# Customize columns

There are many ways to customize existing columns in the table.

## Using the `columnOverrides`

If you want to update the existing columns, you can use the [`columnOverrides`](/table/table-page-component#columnoverrides) prop.  

```tsx title="Example of modifying email column"
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

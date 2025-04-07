---
sidebar_position: 1
---

# Customize columns

There are many ways to customize existing columns in the table.

## Using the `columnOverrides`

If you want to update the existing columns, you can use the [`columnOverrides`](/table/table-page-component#columnoverrides) prop.  

```jsx title="Example of modifying email column"
export default () => (
  <TablePage
    columnOverrides={{
      // Modifying the email column
      email: column => ({
        ...column,

        // The display column name
        label: 'Email address',

        // Optional render function to display the column content
        render: ({ email }) => <a href={`mailto:${email}`}>{email}</a>,
      }),
    }}
  />
);
```

You can learn more about the available column configurations on the [TablePage Component](/table/table-page-component#columns-1) page.

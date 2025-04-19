---
sidebar_position: 2
---

# Add custom fields

In Kottster, all fields are basically columns. If you need to add custom fields to the form, you need to add custom columns to the table configuration.

## Using the `customColumns`

If you want to add a new field to existing fields, you can use the [`customColumns`](/table/table-page-component#customcolumns) prop.  

```tsx title="Example of adding a QR code field"
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
      },
    ]}
  />
);
```

Learn more about `fieldInput` and its parameters in the [API reference](/table/configuration/api#field-inputs).

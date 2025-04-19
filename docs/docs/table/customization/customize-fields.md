---
sidebar_position: 4
---

# Customize fields

In Kottster, all fields are basically columns. If toy need to customize fields in the form, you need to update columns configuration in the table configuration.

## Using the `columnOverrides`

If you want to update the existing columns, you can use the [`columnOverrides`](/table/table-page-component#columnoverrides) prop.  

```tsx title="Example of modifying email field"
export default () => (
  <TablePage
    columnOverrides={{
      // Modifying the email column
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
                onChange={(e) => updateFieldValue('first_name', e.target.value)} 
              />
            )
          },
        },
      }),
    }}
  />
);
```

Learn more about `fieldInput` and its parameters in the [API reference](/table/configuration/api#field-inputs).
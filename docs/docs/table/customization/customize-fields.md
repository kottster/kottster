---
sidebar_position: 4
---

# Customize fields

There are many ways to customize existing fields in the form.

## Using the `fieldOverrides`

If you want to update the existing field, you can use the [`fieldOverrides`](/table/table-page-component#fieldoverrides) prop.  

```jsx title="Example of modifying email field"
export default () => (
  <TablePage
    form={{
      fieldOverrides: {
        // Modifying the email field
        email: field => ({
          ...field,

          // The display field name
          label: 'Email address',

          // The custom field type
          formField: {
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
            }
          },
        }),
      },
    }}
  />
);
```

You can learn more about the available field configurations on the [TablePage Component](/table/table-page-component#form-fields) page.

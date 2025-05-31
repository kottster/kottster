---
sidebar_position: 4
---

# Customize fields

In Kottster, **all fields are basically table columns**. If you need to customize fields in the form, you need to update columns configuration in the table configuration.

## On the client side

**Using the `columnOverrides` in the `TablePage` component**

If you want to update existing fields, you can use the [`columnOverrides`](/table/table-page-component#columnoverrides) prop. This is useful for adding custom render for field inputs.

Add the `columnOverrides` prop to the `TablePage` component. This prop accepts an object where each key is the column name and the value is a function that takes the existing column configuration and returns the modified column configuration.

**Example of modifying email field:**

```jsx title="app/pages/users/index.jsx"
import { TablePage } from '@kottster/react';

export default () => (
  <TablePage
    columnOverrides={{
      // Modifying the field input of the email column
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
                onChange={(e) => updateFieldValue('email', e.target.value)} 
              />
            )
          },
        }
      }),
    }}
  />
);
```

Learn more about `fieldInput` and its parameters in the [API reference](/table/configuration/api#field-inputs).
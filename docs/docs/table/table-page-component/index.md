---
sidebar_position: 4
---

# TablePage component

The `TablePage` component displays a dynamic table for viewing and managing data from a database. It includes features like search, sorting, filtering, and a record modal for inserting or updating records.

The component is tightly connected to the [`defineTableController`](/table/configuration/api) settings, which manage both API interactions and table behavior. If you want extra control over **how the main table looks or works on the client side**, you need to use the `TablePage` component.


## Properties

- ### title

  `string`, optional

  The title displayed at the top of the page. If not provided, the nav item label will be used as the default.

- ### columns

  `TableColumn[]`, optional

  Learn more: [Columns](#columns-1)

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

  - #### fields

    `FormField[]`, optional

    Learn more: [Form Fields](#form-fields)

  - #### fieldTransformer

    `(fields: FormField[]) => FormField[]`, optional

    A custom function used to transform the automatically determined form fields.

    ```typescript title="Example"
    fieldTransformer: fields => [
      ...fields,
      {
        column: 'url',
        label: 'Post URL',
        formField: {
          type: 'input',
        }
      },
    ]
    ```

  - #### fieldOverrides

    `Record<string, FormField | ((field: FormField) => FormField)>`, optional

    A custom object used to override the automatically determined form fields.

    ```typescript title="Example"
    fieldOverrides: {
      // Full replacement of the description field
      description: { 
        column: 'description',
        label: 'Description',
        formField: {
          type: 'textarea',
        }
      },

      // Adjustment of the price field
      price: field => ({
        ...field,
        label: 'Price',
        formField: {
          type: 'numberInput',
          allowDecimal: true,
        }
      }),
    }
    ```

- ### headerRightSection

  A custom component displayed on the right side of the page header.

- ### headerBottomSection

  A custom component displayed below the page header.


## Columns

By default, columns are automatically generated based on your database schema and [`defineTableController`](/table/configuration/api) settings. But you can also define the columns explicitly using the `columns` prop.

Here’s an example of a `columns` prop with defined columns:

```tsx
<TablePage
   columns={[
      { label: 'ID', column: 'id' },
      { label: 'Email address', column: 'email' },
      { label: 'Name', column: 'first_name' },
   ]}   
/>
```

### Parameters

Each column is defined as an object with the following parameters:

- #### column
  
  `string`

  The name of the column in the database table.

- #### label

  `string`, optional

  The text displayed in the table header for this column. If not provided, the value from column will be used as the default.

- #### width

  `number`, optional

  The width of the column in pixels. If not specified, the column will adjust to fit its content.

- #### render

  `function`, optional

  A custom function used to render content in the table cells. It receives the record data as an argument.

  ```typescript title="Example #1"
  {
    label: 'Full name',
    column: 'full_name',
    render: (record) => `${record.firstName} ${record.lastName}`   
  }
  ```

  ```typescript title="Example #2"
  {
    label: 'Email',
    column: 'email',
    render: (record) => (
        <a href={`mailto:${record.email}`}>{record.email}</a>
    )
  }
  ```

- #### linkedKey

  `string`, optional

  Specifies the linked relation key for the column. This is required when you want to display linked records in the table.

  Learn more: [Linked records (Joins)](/table/configuration/linked-records)


## Form Fields

By default, form fields are automatically generated based on your database schema and [`defineTableController`](/table/configuration/api) settings. But you can also define the form fields explicitly using the `form.fields` prop.

Here’s an example of the `fields` parameter with defined fields:

```tsx
<PageTable
  columns={/* ... */}
  form={{
    fields: [
      { label: 'First name', column: 'first_name', type: 'input' },
      { label: 'Last name', column: 'last_name', type: 'input' },
      { label: 'Email', column: 'email', type: 'input' },
      { label: 'Birth date', column: 'birth_date', type: 'datePicker' },
    ]
  }}
/>
```

Each field is an object with the following options:

- **column** (`string`): The name of the column in the table.
- **label** (`string`, optional): The label displayed to users for this field. Defaults to the column name if not provided.
- **formField** (`string`, optional): Specifies the type of form field to use for this column
- **required** (`boolean`, optional): If true, this field must be filled out in form.
- **span** (`number`, optional): Sets how wide the field should be in a 12-column layout. You can choose a value from 1 to 12, where 1 is the narrowest and 12 takes up the full width. The default is 12.

### Basic field types

The type property defines the field type and supports additional properties depending on the type. 

Below is a list of supported formFields types and their interfaces:

- #### input
      
      A single-line text input. 

      ```typescript
      {
        type: 'input'
      }
      ```

- #### numberInput

      A number-only input field.

      ```typescript
      {
        type: 'numberInput',
        
        /** Determines whether decimal values are allowed, true by default */
        allowDecimal?: boolean;
      }
      ```

- #### textarea
      
      A multi-line text input.

      ```typescript
      {
        type: 'textarea'
      }
      ```

- #### select

      A searchable dropdown menu.

      ```typescript
      {
        type: 'select',
        
        /** List of selectable options */
        options: { 
          /** Display label for the option */
          label: string; 
          
          /** Value associated with the option */
          value: string; 
        }[]
      }
      ```
- #### checkbox

      A checkbox for boolean input.

      ```typescript
      {
        type: 'checkbox'
      }
      ```

- #### datePicker

      An inline date (datetime) picker.

      ```typescript
      {
        type: 'datePicker',
        
        /** Adds time picker */
        withTime: boolean,
        
        /** Adds seconds input to time picker */
        timeWithSeconds: boolean
      }
      ```

- #### timePicker

      An inline time picker.

      ```typescript
      {
        type: 'timePicker',
        
        /** Adds seconds input */
        withSeconds: boolean;
      }
      ```

- #### recordSelect

      Select records from another table.

      Requires a one-to-one relationship to be configured (see [one-to-one linked](/table/configuration/linked-records#one-to-one)). 

      ```typescript
      {
        type: 'recordSelect',
        
        /** The linked relation key */
        linkedKey?: string;
      }
      ```

### Custom field

Use a custom React component for input.

```tsx
{
  type: 'custom',
  
  /** Function to render a custom React component */
  renderComponent: (
    value: any, 
    onChange: (value: any) => void,
    params?: {
      hasError: boolean;
      readOnly: boolean;
    }
  ) => any
}
```

```tsx title="Example"
{
  type: 'custom',

  renderComponent: (value, onChange) => (
      <MyCustomInput value={value} onChange={onChange} />
  ),
}
```
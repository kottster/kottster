---
description: "Define a table controller in Kottster to handle server-side requests for table pages. Customize table settings, relationships, and more."
---

# Table page configuration

The `defineTableController` function creates a server-side controller that handles requests from table pages. It connects to your database and defines what data is available to the table component and how it behaves.

This function is used in the optional `api.server.js` file within a page directory and should be exported as the default export.

## Basic usage

### Configuring the main table

When you need customization beyond what the visual builder provides, you can pass additional configuration to the `defineTableController` function in the `api.server.js` file.

**Example:**

```tsx [app/pages/users/api.server.js]
import { app } from '../../_server/app';

const controller = app.defineTableController({
  // Additional configuration here
  validateRecordBeforeInsert: (values) => {
    if (!values.email.includes('@')) {
      throw new Error('Invalid email');
    }

    return true;
  },
});

export default controller;
```

### Configuring nested tables

You can also configure nested tables by adding a `nested` property in the table controller configuration. Each nested table can have its own configuration.

**Example:**

```typescript [app/pages/users/api.server.js]
import { app } from '../../_server/app';

const controller = app.defineTableController({
  // Additional configuration for the main table
  validateRecordBeforeInsert: (values) => {
    if (!values.email.includes('@')) {
      throw new Error('Invalid email');
    }

    return true;
  },

  nested: {
    orders__p__user_id: {
      // Additional configuration for the nested table
      validateRecordBeforeInsert: (values) => {
        if (!values.amount || values.amount <= 0) {
          throw new Error('Amount must be greater than zero');
        }
        return true;
      },
    },
  },
});

export default controller;
```

## Usage

The `defineTableController` function takes two arguments:
    
*   `config`: A configuration object that defines the behavior of the table and its nested tables.

*   `serverProcedures`: An optional object that allows you to define custom server procedures for the page. See the [Custom server API](#custom-server-procedures) section for more details.

If you only need to change the way columns and fields are rendered, you can use the [`TablePage`](../../ui/table-page-component.md) component's properties like [`customColumns`](../../ui/table-page-component.md#customcolumns), [`columnTransformer`](../../ui/table-page-component.md#columntransformer), or [`columnOverrides`](../../ui/table-page-component.md#columnoverrides). This approach is useful for modifying the display of columns and fields without changing the backend logic.

## Parameters

- ### fetchStrategy

  `"databaseTable" | "rawSqlQuery" | "customFetch"`, required

  Specifies the strategy for fetching data for the table. The available options are:
  - `"databaseTable"`: Fetches data directly from a database table.
  - `"rawSqlQuery"`: Executes a raw SQL query to fetch data.
  - `"customFetch"`: Uses a custom data fetcher function (`customDataFetcher`) to retrieve data.

- ### dataSource

  `string`, optional

  Used to specify the data source for the table. This is required if you are using the `databaseTable` or `rawSqlQuery` fetch strategies. The value should match the name of a data source defined in your project.

- ### table

  `string`, optional

  Specifies the name of the database table. This is required if you are using the `databaseTable` fetch strategy.

- ### primaryKeyColumn

  `string`, optional

  Specifies the primary key column in the table. Typically, this is set to `"id"`.

- ### defaultSortColumn

  `string`, optional

  Specifies the default column to sort the table by. If not specified, the default value is the primary key column.

- ### defaultSortDirection

  `"asc" | "desc"`, optional

  Specifies the default sort direction. If not specified, the default value is `"desc"`.

- ### columns

  `TablePageConfigColumn[]`, optional

  Specifies the configuration for the columns in the table. 
  
  Learn more: [Columns](#columns-1)

- ### customDataFetcher

  `function`, optional

  <!-- Allow to define define custom logic for executing the query. This function is called with the query object and should return a promise that resolves to the query result. -->
  Defines a custom function to retrieve data for the table. This function is required if you are using the `customFetch` fetch strategy.

  Learn more: [Custom data fetcher](./custom-data-fetcher.md)

- ### allowInsert

  `boolean`, optional

  Allows users to insert new records into the table. If not specified, the default value is `true`.

- ### allowedRolesToInsert

  `string[]`, optional

  Specifies the role names that are allowed to insert records into the table. If not specified, all users can insert records unless `allowInsert` is set to `false`.

- ### validateRecordBeforeInsert

  `function`, optional

  Defines a function to validate the record values before they are inserted into the table. This function is called with the record values and should return a boolean indicating whether the values are valid.

  It can also throw an error with a message to indicate why the record is invalid.

  ```typescript [Example]
  validateRecordBeforeInsert: (values) => {
    if (!values.email.includes('@')) {
      throw new Error('Invalid email');
    }

    return true;
  }
  ```

- ### transformRecordBeforeInsert

  `function`, optional

  A function to transform the record values before they are inserted into the table. This function is called with the record values and should return the transformed values.

  ```typescript [Example]
  transformRecordBeforeInsert: (values) => {
    const secret_token = generate_random_token();
    const created_at = new Date();
    const updated_at = new Date();

    return {
      ...values,
      secret_token,
      created_at,
      updated_at
    }
  }
  ```

- ### afterInsert

  `function`, optional

  A function executed after the record is inserted into the table. This function is often used to perform additional actions, such as sending notifications or updating related records.

  ```typescript [Example]
  afterInsert: (primaryKey, values) => {
    console.log(`Record with ID ${primaryKey} was inserted with values:`, values);
  }
  ```

- ### allowUpdate

  `boolean`, optional

  Allows users to update records in the table. If not specified, the default value is `true`.

- ### allowedRolesToUpdate

  `string[]`, optional

  Specifies the role names that are allowed to update records in the table. If not specified, all users can update records unless `allowUpdate` is set to `false`.

- ### validateRecordBeforeUpdate

  `function`, optional

  Defines a function to validate the record values before they are updated in the table. This function is called with the primary key and record values, and should return a boolean indicating whether the values are valid.

  It can also throw an error with a message to indicate why the record is invalid.

  ```typescript [Example]
  validateRecordBeforeUpdate: (primaryKey, values) => {
    if (!values.email.includes('@')) {
      throw new Error('Invalid email');
    }

    return true;
  }
  ```

- ### transformRecordBeforeUpdate

  `function`, optional

  Defines a function to transform the record values before they are updated in the table. This function is called with the primary key and record values, and should return the transformed values.

  ```typescript [Example]
  transformRecordBeforeUpdate: (primaryKey, values) => {
    return {
      ...values,
      updated_at: new Date()
    }
  }
  ```

- ### afterUpdate

  `function`, optional

  A function executed after the record is updated in the table. This function is often used to perform additional actions, such as sending notifications or updating related records.

  ```typescript [Example]
  afterUpdate: (primaryKey, values) => {
    console.log(`Record with ID ${primaryKey} was updated with values:`, values);
  }
  ```

- ### allowDelete

  `boolean`, optional

  Allows users to delete records from the table. If not specified, the default value is `true`.

- ### allowedRolesToDelete

  `string[]`, optional

  Specifies the role names that are allowed to delete records from the table. If not specified, all users can delete records unless `allowDelete` is set to `false`.

- ### validateRecordBeforeDelete

  `function`, optional

  Defines a function to validate the record before it is deleted from the table. This function is called with the primary key and should return a boolean indicating whether the record can be deleted.

  It can also throw an error with a message to indicate why the record cannot be deleted.

  ```typescript [Example]
  validateRecordBeforeDelete: (primaryKey) => {
    if (primaryKey === 1) {
      throw new Error('Admin user cannot be deleted');
    }

    return true;
  }
  ```

- ### afterDelete

  `function`, optional

  A function executed after the record is deleted from the table. This function is often used to perform additional actions, such as sending notifications or deleting related records.

  ```typescript [Example]
  afterDelete: (primaryKey) => {
    console.log(`Record with ID ${primaryKey} was deleted`);
  }
  ```

- ### customSqlQuery

  `string`, optional

  Specifies a custom SQL query to retrieve the records for the table. This property is required if you are using the `rawSqlQuery` fetch strategy.
  
  Learn more: [Raw SQL queries](./raw-sql-queries.md)

- ### customSqlCountQuery

  `string`, optional

  Specifies a custom SQL query to count the records for the table. This query should return a single numeric value.

  Learn more: [Raw SQL queries](./raw-sql-queries.md)

- ### knexQueryModifier

  `(knex: Knex.QueryBuilder) => Knex.QueryBuilder`, optional

  A function that modifies the Knex query before it is executed. This function is often used to add custom where clauses, joins, or other query modifications. 
  Learn more in the [Knex documentation](https://knexjs.org/guide/query-builder.html).

  ```typescript [Example with where clause]
  knexQueryModifier: (knex) => {
    return knex.where('is_active', true);
  }
  ```

  ```typescript [Example with group by]
  knexQueryModifier: (knex) => {
    return knex.groupBy('user_id');
  }
  ```

- ### calculatedColumns

  `TablePageConfigCalculatedColumn[]`, optional

  Specifies the configuration for the calculated columns in the table. 

  Each calculated column should have the following properties:

  - #### label

    `string`, optional

    Specifies the display name of the calculated column. If not specified, the label will be generated automatically based on the column alias.

  - #### alias

    `string`, required

    Specifies the alias for the calculated column. This is used to reference the column after querying the database.

  - #### sqlExpression

    `string`, required

    Specifies the SQL expression to calculate the value. This expression should return a single value.

    The SQL expression can reference the main table using the `main` alias. 

    For example, if you want to count the number of orders for each user, you can use the following SQL expression:

    ```sql
    SELECT COUNT(*) 
    FROM orders 
    WHERE orders.user_id = main.id AND orders.status = 'completed'
    ```
  - #### position

    `number`, optional

    Specifies the position of the calculated column in the table. If not specified, the calculated columns will be displayed at the end of the table.

- ### nested

  An object that defines configurations for nested tables. Each key in this object corresponds to a nested table configuration.

  Each nested table configuration has all the properties of a regular table configuration.

- ### relationships

  Specifies the configuration for the relationships the table has with other tables.

  By default, Kottster detects relationships between tables based on foreign keys. 
  
  Learn more: [Relationships](./relationships.md)

  Each relation should have `key` property, which specifies the name of the relation. The key is used to access the relation in the table configuration.

  Each relation object can have the following properties:

  - #### hiddenInTable

    `boolean`, optional

    Specifies whether the relation should be hidden in the table. If not specified, the default value is `false`.

  - #### position

    `number`, optional

    Specifies the position of the relation in the table. If not specified, relationships columns will be displayed in the end of the table.

## Columns

Specifies the configuration for the columns in the table. Each column configuration should have `column` property, which specifies the name of the column in the database table. 
  
If configuration or its properties are not specified, the default values will be used.
The default values are determined automatically based on the database schema. 

### Parameters

Each column can have the following properties:

- #### column

  `string`, required

  Specifies the name of the column. Could be a real column name in the database table or a custom name for a calculated column.

- #### label

  `string`, optional

  Specifies the display name of the column. If not specified, the label will be generated automatically based on the column name.


- #### hiddenInTable

  `boolean`, optional

  Specifies whether the column should be hidden in the table. If not specified, the default value is `false`.

- #### hiddenInForm

  `boolean`, optional

  Specifies whether the column should be hidden in the form.

- #### sortable

  `boolean`, optional

  Specifies whether the column can be sorted. If not specified, the default value is `false`.

- #### searchable

  `boolean`, optional

  Specifies whether the column can be searched. If not specified, the default value is `false`.

- #### filterable

  `boolean`, optional

  Specifies whether the column can be filtered. If not specified, the default value is `false`.

- #### position

  `number`, optional

  Specifies the position of the column in the table. If not specified, the columns will be displayed in default order. 

- #### width

  `number`, optional

  Specifies the width of the column in pixels.

- #### prefix

  `string`, optional

  Specifies the prefix to be added before the column value. E.g., `"$"` for currency columns.

- #### suffix

  `string`, optional

  Specifies the suffix to be added after the column value. E.g., `"%"` for percentage columns.

- #### fieldInput

  `FieldInput`, optional

  Specifies the field input configuration for the column. 

  Learn more: [Field inputs](#field-inputs)

- #### fieldRequirement

  `"none" | "notEmpty" | "notZero"`, optional

  Specifies the requirements for the form field.

- #### hiddenInForm

  `boolean`, optional

  Specifies whether the column should be hidden in the form. If not specified, the default value is `false`.

- #### formFieldSpan

  `"12" | "8" | "6" | "4"`, optional

  Specifies the span of the form field in the grid. The default value is `12`, which means the field will take the full width of the form.

- #### relationshipPreviewColumns

  `string[]`, optional

  If the column is a foreign key and has a one-to-one relationship with another table, this property allows to specify the columns to display for linked record preview. The value is an array of column names to display. Works only for one-to-one linked relations.

  ```json [Example]
  relationshipPreviewColumns: ["id", "email"]
  ```
- #### render

  `(record: Record<string, any>) => any`, optional

  A custom function used to render content in the table cells. It receives the record data as an argument. This parameter only available on the client side.

  ```typescript [Example]
  {
    label: 'Full name',
    column: 'full_name',
    render: (record) => `${record.firstName} ${record.lastName}`   
  }
  ```

## Field inputs

By default, form fields are automatically generated based on your database schema and [`defineTableController`](../../table/introduction.md) settings. 

But you can also define the form input explicitly using the `formInput` property in the [column configuration](#columns).

```typescript [Example]
columns: [
  {
    'column': 'description',
    'label: 'Description',
    'formInput: {
      'type': 'textarea'
    }
  },
  {
    'column': 'balance',
    'label': 'Balance',
    'prefix': '$',
    'formInput': {
      'type': 'numberInput',
      'allowDecimal': true
    }
  }
]
```

### Field input types

The type property defines the field type and supports additional properties depending on the type. 

Below is a list of supported field input types and their interfaces:

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

    Requires a one-to-one relationship defined in the database schema or in the [`relationships`](#relationships) property of the table configuration.

    ```typescript
    {
      type: 'recordSelect',
      
      /** The key of the relationship */
      relationshipKey?: string;
    }
    ```

### Custom field input

If you need to use a custom field input, you can define it using the type `custom` and the `renderComponent` function. This requires you to add `index.jsx` file in your page directory. 

Learn more: [Table Page Component](../../ui/table-page-component.md)

This function receives the following parameters:
- `value`: The current value of the field.
- `values`: The current values of the form.
- `record`: The original record data including the primary key.
- `updateFieldValue(key: string, value: any)`: A function to update the field value.
- `meta`: An object containing metadata about the field, including:
  - `hasError`: A boolean indicating if the field has an error (e.g., validation error).
  - `readOnly`: A boolean indicating if the field is read-only.

```tsx [Example with custom textarea component]
{
  type: 'custom',

  renderComponent: ({ value, updateFieldValue }) => {
    return (
      <textarea 
        value={value} 
        onChange={e => updateFieldValue('description', e.target.value)} 
      />
    );
  }
}
```

## Custom server API

You can extend your table controller with [custom server procedures](../../custom-pages/api.md) to handle specific business logic that goes beyond standard table operations. These procedures can be called from the frontend using the [`useCallProcedure`](../../custom-pages/calling-api.md) hook.

### Adding custom server procedures

**Example:**

```tsx [app/pages/users/api.server.js]
import { app } from '../../_server/app';

const controller = app.defineTableController({}, {
  // Custom server procedures
  sendWelcomeEmail: async (data) => {
    const { userEmail } = data;
    
    // Send email logic here
    console.log(`[server] Sending welcome email to ${userEmail}`);
    
    return { success: true };
  },
});

export default controller;
```

### Calling procedures from the frontend

Use the [`useCallProcedure`](../../custom-pages/calling-api.md) hook to call your custom procedures from the table page:

**Example:**

```tsx [app/pages/users/index.jsx]
import { TablePage, useCallProcedure } from '@kottster/react';
import { Button } from '@mantine/core';

export default () => {
  const callProcedure = useCallProcedure();
  
  const handleSendWelcomeEmail = async (userEmail) => {
    try {
      const result = await callProcedure('sendWelcomeEmail', { userEmail });
      if (result.success) {
        console.log('Email sent successfully');
      } else {
        console.error('Failed to send email');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };
  
  return (
    <TablePage
      customActions={[
        {
          label: 'Send Welcome Email',
          onClick: (record) => {
            handleSendWelcomeEmail(record.email);
          },
        },
      ]}
    />
  );
};
```

To learn more about defining custom server procedures, visit the [Custom API](../../custom-pages/api.md) and [Calling API](../../custom-pages/calling-api.md) sections.


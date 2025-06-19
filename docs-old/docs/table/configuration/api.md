---
sidebar_position: 1
---

# API Reference

The `defineTableController` function sets up server-side endpoint to handle request from the page with the table component. It connects to a database and defines what data available for the table and how it behaves. It also allows to define configuration for nested tables.

By default, all table pages generated with visual editor will contain a `settings.json` file. This file contains configuration for the main table and its nested tables. It allows you to edit table settings using the visual editor.

Example of files for the table page for `users` table:

```json title="app/pages/users/settings.json"
{
  "_version": "1",
  
  // Configuration for the main table (users)
  "rootTable": {
    "table": "users",
    "allowDelete": false
  },
  
  // Configuration for the nested table (e.g. orders)
  "rootTable_ordersByUserIdTable": {
    "table": "orders",
    "allowInsert": false,
    "allowDelete": false
  }
}
```

```tsx title="app/pages/users/api.server.js"
import { app } from '../../_server/app';
import dataSource from '../../_server/data-sources/postgres';
import pageSettings from './settings.json';

const controller = app.defineTableController(dataSource, {
  ...pageSettings,
  rootTable: {
    ...pageSettings.rootTable,
  },
});

export default controller;
```

**If you need more customization, beyound what visual editor provides**, you can extend the imported `settings.json` configuration with your own settings. This is useful for advanced users who want more control over table configuration.

```typescript title="app/pages/users/api.server.js"
import { app } from '../../_server/app';
import dataSource from '../../_server/data-sources/postgres';
import pageSettings from './settings.json';

export default action = app.defineTableController(dataSource, {
  ...pageSettings,

  // Configuration for the main table 
  rootTable: {
    ...pageSettings.rootTable,

    // Add custom configuration here...
  },

  // Configuration for the nested table
  rootTable_ordersByUserIdTable: {
    ...pageSettings.rootTable_ordersByUserIdTable,
    
    // Add custom configuration here...
  },
});
```


## Usage

The `defineTableController` function takes two required arguments:

*   **`dataSource`**: A data source. Typically, imported from the `app/_server/data-sources` directory.
    
*   **`settings`**: A configuration object that defines the behavior of the table and its nested tables. The configuration for the main table is defined under the `rootTable` key.

Alternatively, you can customize already defined configuration on the client side using methods like `customColumns`, `columnTransformer`, `columnOverrides` on the [`TablePage`](/table/table-page-component) component. This approach is useful if you want to change **the way columns and fields are rendered**, or use **JSX components**.

## Parameters

- ### table

  `string`, optional

  Specifies the name of the database table. If not specified, the `executeQuery` function should be provided to define the query.

- ### primaryKeyColumn

  `string`, optional

  Specifies the primary key column in the table. Typically, this is set to `"id"`.

- ### pageSize

  `number`, optional

  Specifies the number of records to display per page. If not specified, the default value is `20`.

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

- ### executeQuery

  `function`, optional

  Allow to define define custom logic for executing the query. This function is called with the query object and should return a promise that resolves to the query result.

  Learn more: [Custom queries](/table/configuration/custom-queries)

- ### allowInsert

  `boolean`, optional

  Allows users to insert new records into the table. If not specified, the default value is `true`.

- ### beforeInsert

  `function`, optional

  A function executed on the record before it is inserted into the table. This function is often used to format data, add missing but required properties, or generate sensitive data that the user should not input directly (e.g., password hashes, access tokens).

  ```typescript title="Example"
  beforeInsert: (record) => {
      const secret_token = generate_random_token();
      const created_at = new Date();
      const updated_at = new Date();    
  
      return {
          ...record,
          secret_token,
          created_at,
          updated_at
      }
  }
  ```

- ### canBeInserted

  `function`, optional

  A function for server-side validation before a record is inserted.

  If the function returns `true`, the record is inserted.

  If it returns `false` or throws an `Error`, the record is not inserted, and the user receives an error message.

  ```typescript title="Example"
  canBeInserted: (record) => {
      if (!record.email.includes('@')) {
          throw new Error('Invalid email');
      }
      
      const isEmailTaken = !!(await knex('users').where('email', record.email).count());
      if (isEmailTaken) {
          throw new Error('A user with this email already exists');
      }
  
      return true;
  }
  ```

- ### allowUpdate

  `boolean`, optional

  Allows users to update records in the table. If not specified, the default value is `true`.

- ### beforeUpdate

  `function`, optional

  A function executed on the record before it is updated in the table. This function is often used to format data, add missing but required properties, or generate sensitive data that the user should not input directly (e.g., password hashes, access tokens).

  ```typescript title="Example"
  beforeUpdate: (record) => {
      return {
          ...record,
          updated_at: new Date()
      }
  }
  ```

- ### canBeUpdated

  `function`, optional

  A function for server-side validation before a record is updated.

  If the function returns `true`, the record is updated.

  If it returns `false` or throws an `Error`, the record is not updated, and the user receives an error message.

  ```typescript title="Example"
  canBeUpdated: (record) => {
      if (!record.email.includes('@')) {
          throw new Error('Invalid email');
      }

      return true;
  }
  ```

- ### allowDelete

  `boolean`, optional

  Allows users to delete records from the table. If not specified, the default value is `true`.

- ### canBeDeleted

  `function`, optional

  A function for server-side validation before a record is deleted.

  If the function returns `true`, the record is deleted.

  If it returns `false` or throws an `Error`, the record is not deleted, and the user receives an error message.

  ```typescript title="Example"
  canBeDeleted: (record) => {
      if (record.role === 'ADMIN') {
          throw new Error('Admin users cannot be deleted.');
      }
  
      return true;
  }
  ```

- ### knexQueryModifier

  `(knex: Knex.QueryBuilder) => Knex.QueryBuilder`, optional

  A function that modifies the Knex query before it is executed. This function is often used to add custom where clauses, joins, or other query modifications. 
  Learn more in the [Knex documentation](https://knexjs.org/guide/query-builder.html).

  ```typescript title="Example with where clause"
  knexQueryModifier: (knex) => {
    return knex.where('is_active', true);
  }
  ```

  ```typescript title="Example with group by"
  knexQueryModifier: (knex) => {
    return knex.groupBy('user_id');
  }
  ```

- ### calculatedColumns

  `TablePageConfigCalculatedColumn[]`, optional

  Specifies the configuration for the calculated columns in the table. 

  Each calculated column should have the following properties:

  - #### alias

    `string`, required

    Specifies the alias for the calculated column. This is used to reference the column after querying the database.

  - #### sqlExpression

    `string`, required

    Specifies the SQL expression to calculate the value. This expression should return a single value.

    The SQL expression can reference the main table using the `main` alias. 

    For example, if you want to count the number of orders for each user, you can use the following SQL expression:

    ```sql
    SELECT COUNT(*) FROM orders WHERE orders.user_id = main.id AND orders.status = 'completed'
    ```

  Learn more: [Adding calculated columns](/table/customization/add-custom-columns#calculated-columns)

- ### relationships

  Specifies the configuration for the relationships the table has with other tables.

  By default, Kottster detects relationships between tables based on foreign keys. But you can also define custom relationships: [Custom relationships](/table/configuration/custom-relationships)

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

```json title="Example"
{
  "_version": "1",
  
  "rootTable": {
    "table": "users",
    
    "columns": [
      {
        "column": "first_name",
        "label": "Name"
      },
      {
        "column": "balance",
        "label": "Balance",
        "prefix": "$"
      }
    ]
  }
}
```

### Parameters

Each column can have the following properties:

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

  ```json title="Example"
  relationshipPreviewColumns: ["id", "email"]
  ```
- #### render

  `(record: Record<string, any>) => any`, optional

  A custom function used to render content in the table cells. It receives the record data as an argument. This parameter only available on the client side.

  ```typescript title="Example #1"
  {
    label: 'Full name',
    column: 'full_name',
    render: (record) => `${record.firstName} ${record.lastName}`   
  }
  ```

## Field inputs

By default, form fields are automatically generated based on your database schema and [`defineTableController`](/table/configuration/api) settings. 

But you can also define the form input explicitly using the `formInput` property in the [column configuration](#columns).

```json title="Example"
{
  "_version": "1",
  
  "rootTable": {
    "table": "users",
    
    "columns": [
      {
        "column": "description",
        "label": "Description",
        "formInput": {
          "type": "textarea"
        }
      },
      {
        "column": "balance",
        "label": "Balance",
        "prefix": "$",
        "formInput": {
          "type": "numberInput",
          "allowDecimal": true
        }
      }
    ]
  }
}
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

If you need to use a custom field input, you can define it using the type `custom` and the `renderComponent` function.

This function receives the following parameters:
- `value`: The current value of the field.
- `values`: The current values of the form.
- `record`: The original record data including the primary key.
- `updateFieldValue(key: string, value: any)`: A function to update the field value.
- `meta`: An object containing metadata about the field, including:
  - `hasError`: A boolean indicating if the field has an error (e.g., validation error).
  - `readOnly`: A boolean indicating if the field is read-only.

```tsx title="Example with custom textarea component"
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
---
sidebar_position: 1
---

# API Reference

The `defineTableController` function sets up server-side endpoint to handle request from the page with the table component. It connects to a database and defines what data available for the table and how it behaves. It also allows to define [configuration for nested tables](#configuration-for-nested-tables).

```typescript title="Example"
export default action = app.defineTableController(dataSource, {
  rootTable: {
    table: 'users',
    primaryKeyColumn: 'id',
    pageSize: 16,
    allowInsert: false,
    allowUpdate: true,
    allowDelete: false,
  },
});
```

## Usage

The `defineTableController` function takes two required arguments:

*   **`dataSource`**: A data source. Typically, imported from the `./app/.server/data-sources` directory.
    
*   **`settings`**: A configuration object that defines the behavior of the table and its nested tables. The configuration for the main table is defined under the `rootTable` key.

## Parameters

- ### table

  `string`, optional

  Specifies the name of the database table.

- ### primaryKeyColumn

  `string`, optional

  Specifies the primary key column in the table. Typically, this is set to `"id"`.

- ### pageSize

  `number`, optional

  Sets the number of records displayed per page for table pagination.

- ### columns

  `string[]`, optional

  Specifies the columns to include in the query and display by default.

  If not specified, all columns `(*)` will be included in the query.

  ```json title="Example"
  columns: ["first_name", "last_name", "email", "phone_number"]
  ```

- ### columnsOrder

  `string[]`, optional

  Specifies the order of columns in the table. If not specified, the columns will be displayed in the auto-generated order. If only some columns are specified, the rest will be displayed after the specified columns in the auto-generated order.

  ```json title="Example"
  columnsOrder: ["first_name", "last_name", "email"]
  ```

- ### hiddenColumns

  `string[]`, optional

  Specifies columns to exclude from the returned data. This is commonly used for system-generated or sensitive data (e.g., password hashes, access tokens). 

  ```json title="Example"
  hiddenColumns: ["password_hash", "address", "updated_at"]
  ```

- ### searchableColumns

  `string[]`, optional

  Enables a search input at the top of the table. Specifies the columns that are searchable, typically applicable to text or numeric column types.

  ```json title="Example"
  searchableColumns: ["first_name", "last_name", "email"]
  ```

- ### sortablecolumns

  `string[]`, optional

  Enables sorting functionality by clicking on column headers. Specifies the columns that can be sorted.

  ```json title="Example"
  sortableColumns: ["created_at"]
  ```

- ### filterableColumns

  `string[]`, optional

  Adds a "Filters" button at the top of the table. Specifies the columns that can be filtered.

  ```json title="Example"
  filterableColumns: ["status"]
  ```

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

- ### fornHiddenColumns

  `string[]`, optional

  Specifies the columns to include in the form. 
  
  This is commonly used for system-generated or sensitive data (e.g., password hashes, access tokens).

  ```json title="Example"
  formHiddenColumns: ["password_hash", "updated_at"]
  ```

- ### formColumnsOrder

  `string[]`, optional

  Specifies the order of columns in the form. If not specified, the columns will be displayed in the auto-generated order. If only some columns are specified, the rest will be displayed after the specified columns in the auto-generated order.

  ```json title="Example"
  formColumnsOrder: ["first_name", "last_name", "email"]
  ```

- ### formColumnsRequirements

  `{ column: srting; rule: string; }[]`, optional

  Specifies the requirements for the form columns. The `rule` can be one of the following: `none`, `notEmpty`, `notZero`. If not specified, the requirements will be determined automatically based on the database schema.

  ```json title="Example"
  formColumnsRequirements: [
    { column: "email", rule: "notEmpty" },
    { column: "role", rule: "notZero" }
  ]
  ```

- ### formColumnsFormFields

  `{ column: string; type: string; }[]`, optional

  Specifies the form fields for the form columns. The `type` can be one of the following: `input`, `numberInput`, `textarea`, `select`, `checkbox`, `datePicker`, `timePicker`, `dateTimePicker`. If not specified, the type will be determined automatically based on the database schema.

  ```json title="Example"
  formColumnsFormFields: [
    { column: "description", type: "textarea" },
    { column: "total", type: "numberInput" }
  ]
  ```

- ### linked

  Allows to set up custom linked relations between tables. Learn more: [Linked records (Joins)](/table/configuration/linked-records)

  If not specified, the linked records will be determined automatically based on the database schema.

- ### hiddenLinkedItems

  `string[]`, optional

  Allow to hide automatically determined linked relations.

  ```json title="Example"
  hiddenLinkedItems: ["usersByWorkspaceId"]
  ```

- ### linkedItemPreviewColumns

  `{ [key: string]: string[] }`, optional

  Allow to specify columns to display for linked record preview. Key is the linked relation key, value is the array of columns to display. Works only for one-to-one linked relations.

  ```json title="Example"
  linkedItemPreviewColumns: {
    usersByUserId: ["id", "email"]
  }
  ```

# Configuration for nested tables
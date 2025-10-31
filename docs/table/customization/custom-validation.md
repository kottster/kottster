---
description: ""
---

# Custom validation

Kottster allows you to add custom validation logic to your table pages for create, update, and delete operations.

**Add validation by passing functions to these configuration parameters:**

- [`validateRecordBeforeInsert`](../configuration/api.md#validaterecordbeforeinsert)
- [`validateRecordBeforeUpdate`](../configuration/api.md#validaterecordbeforeupdate)
- [`validateRecordBeforeDelete`](../configuration/api.md#validaterecordbeforedelete)

When a validation function throws an error, the operation is aborted and the error message is displayed to the user.

## Example usage

**Example with basic validation:**

```jsx [app/pages/users/index.jsx]
import { app } from '../../_server/app';

const controller = app.defineTableController({
  // Validate before inserting a record
  validateRecordBeforeInsert: (values) => {
    if (!values.email.includes('@')) {
      throw new Error('Invalid email');
    }

    return true;
  },

  // Validate before updating a record
  validateRecordBeforeUpdate: (primaryKey, values) => {
    if (!values.email.includes('@')) {
      throw new Error('Invalid email');
    }

    return true;
  },

  // Validate before deleting a record
  validateRecordBeforeDelete: (primaryKey) => {
    if (primaryKey === 1) {
      throw new Error('User with ID 1 cannot be deleted.');
    }

    return true;
  },
});

export default controller;
```

**Example with async validation and database queries:**

```jsx [app/pages/users/index.jsx]
import { app } from '../../_server/app';
import dataSource from '../../_server/data-sources/postgres_db';

const knex = dataSource.getClient();

const controller = app.defineTableController({
  // Validate before inserting a record
  validateRecordBeforeInsert: async (values) => {
    const emailExists = await knex('users')
      .where({ email: values.email })
      .first();
    if (emailExists) {
      throw new Error('User with this email already exists.');
    }

    return true;
  },

  // Validate before updating a record
  validateRecordBeforeUpdate: async (primaryKey, values) => {
    const emailExists = await knex('users')
      .where({ email: values.email })
      .andWhereNot({ id: primaryKey })
      .first();
    if (emailExists) {
      throw new Error('Another user with this email already exists.');
    }

    return true;
  },

  // Validate before deleting a record
  validateRecordBeforeDelete: async (primaryKey) => {
    const user = await knex('users')
      .where({ id: primaryKey })
      .first();
    if (user && user.role === 'admin') {
      throw new Error('Admin users cannot be deleted.');
    }

    return true;
  },
});

export default controller;
```
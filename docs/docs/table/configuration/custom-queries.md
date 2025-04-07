---
sidebar_position: 3
---

# Custom queries

By default, Kottster manages data fetching internally. You can also define custom fetching logic, such as using raw SQL or extracting data from an external resource.

To do this, pass a `select` object with an `executeQuery` function to [`defineTableController`](/table/configuration/api):

```typescript
export const action = app.defineTableController(dataSource, {
  executeQuery: async () => {
    return { records: [] };
  },
});
```

To enable viewing and CRUD operations for a table, define the `table` and `primaryKeyColumn` properties:

```typescript
export const action = app.defineTableController(dataSource, {
  rootTable: {
    table: 'users',
    primaryKeyColumn: 'id',
    executeQuery: async () => {
      return { records: [] };
    },
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
  },
});
```

## executeQuery

- **Arguments:**

  An object with the following optional properties:

  - **page** (`number`, optional): The current page number, passed if pagination is enabled.
  - **search** (`string`, optional): A search term, passed if search is enabled.

- **Return value::**

  An object with the following properties:

  - **records** (`array`): An array of records to display in the table.
  - **totalRecords** (`number`, optional): The total number of records. Providing this enables pagination.

## Example with a raw SQL query

This example demonstrates how to use a raw SQL query with [Knex](https://knexjs.org/guide/raw.html) to fetch data.

<details>
  <summary>MySQL example</summary>
  
  ```typescript
  import { TablePage } from '@kottster/react';
  import { app } from '../.server/app';
  import dataSource from '../.server/data-sources/mysql';

  export const action = app.defineTableController(dataSource, {
    executeQuery: async () => {
      const knex = dataSource.adapter.getClient();
      const [records] = await knex.raw(`
        SELECT 
          id, first_name, email 
        FROM 
          users
      `);
      
      return {
        records,
      }
    },
  });

  export default () => (
    <TablePage
      columns={[
        {
          label: 'User ID',
          column: 'id',
        },
        {
          label: 'Name',
          column: 'first_name',
        },
        {
          label: 'Email',
          column: 'email',
        },
      ]}
    />
  );
  ```
</details>

<details>
  <summary>PostgreSQL example</summary>
  
  ```typescript
  import { TablePage } from '@kottster/react';
  import { app } from '../.server/app';
  import dataSource from '../.server/data-sources/postgres';

  export const action = app.defineTableController(dataSource, {
    executeQuery: async () => {
      const knex = dataSource.adapter.getClient();
      const { rows } = await knex.raw(`
        SELECT 
          id, first_name, email 
        FROM 
          users
      `);
      
      return {
        records: rows,
      }
    },
  });

  export default () => (
    <TablePage
      columns={[
        {
          label: 'User ID',
          column: 'id',
        },
        {
          label: 'Name',
          column: 'first_name',
        },
        {
          label: 'Email',
          column: 'email',
        },
      ]}
    />
  );
  ```
</details>

<details>
  <summary>Sqlite example</summary>
  
  ```typescript
  import { TablePage } from '@kottster/react';
  import { app } from '../.server/app';
  import dataSource from '../.server/data-sources/sqlite';

  export const action = app.defineTableController(dataSource, {
    executeQuery: async () => {
      const knex = dataSource.adapter.getClient();
      const records = await knex.raw(`
        SELECT 
          id, first_name, email 
        FROM 
          users
      `);
      
      return {
        records,
      }
    },
  });

  export default () => (
    <TablePage
      columns={[
        {
          label: 'User ID',
          column: 'id',
        },
        {
          label: 'Name',
          column: 'first_name',
        },
        {
          label: 'Email',
          column: 'email',
        },
      ]}
    />
  );
  ```
</details>

> Please notice that in the examples above, we are using the `raw` method from Knex to execute raw SQL queries. This method has diffirent return for each database adapter. For MySQL, it returns an array of records, while for PostgreSQL, it returns an object with a `rows` property containing the records.

## Example with pagination

This example demonstrates how to use a raw SQL query with [Knex](https://knexjs.org/guide/raw.html) to fetch data while supporting pagination:

<details>
  <summary>MySQL example</summary>
  
  ```typescript
  import { TablePage } from '@kottster/react';
  import { app } from '../.server/app';
  import dataSource from '../.server/data-sources/mysql';

  const pageSize = 25;

  export const action = app.defineTableController(dataSource, {
    pageSize,
    executeQuery: async ({ page }) => {
      const knex = dataSource.adapter.getClient();
      const offset = page ? (page - 1) * pageSize : 0;
      
      const [records] = await knex.raw(`
        SELECT 
          id, first_name, email 
        FROM 
          users
        LIMIT :pageSize OFFSET :offset
      `, { pageSize, offset });

      const [[{ count: totalRecords }]] = await knex.raw(`
        SELECT 
          COUNT(*) AS count 
        FROM 
          users
      `);
      
      return {
        records,
        totalRecords,
      }
    },
  });

  export default () => (
    <TablePage
      columns={[
        {
          label: 'User ID',
          column: 'id',
        },
        {
          label: 'Name',
          column: 'first_name',
        },
        {
          label: 'Email',
          column: 'email',
        },
      ]}
    />
  );
  ```
</details>

<details>
  <summary>PostgreSQL example</summary>
  
  ```typescript
  import { TablePage } from '@kottster/react';
  import { app } from '../.server/app';
  import dataSource from '../.server/data-sources/postgres';

  const pageSize = 25;

  export const action = app.defineTableController(dataSource, {
    pageSize,
    executeQuery: async ({ page }) => {
      const knex = dataSource.adapter.getClient();
      const offset = page ? (page - 1) * pageSize : 0;
      
      const { rows: records } = await knex.raw(`
        SELECT 
          id, first_name, email 
        FROM 
          users
        LIMIT :pageSize OFFSET :offset
      `, { pageSize, offset });

      const { rows: [{ count: totalRecords }] } = await knex.raw(`
        SELECT 
          COUNT(*) AS count 
        FROM 
          users
      `);
      
      return {
        records,
        totalRecords,
      }
    },
  });

  export default () => (
    <TablePage
      columns={[
        {
          label: 'User ID',
          column: 'id',
        },
        {
          label: 'Name',
          column: 'first_name',
        },
        {
          label: 'Email',
          column: 'email',
        },
      ]}
    />
  );
  ```
</details>

<details>
  <summary>Sqlite example</summary>
  
  ```typescript
  import { TablePage } from '@kottster/react';
  import { app } from '../.server/app';
  import dataSource from '../.server/data-sources/sqlite';

  const pageSize = 25;

  export const action = app.defineTableController(dataSource, {
    pageSize,
    executeQuery: async ({ page }) => {
      const knex = dataSource.adapter.getClient();
      const offset = page ? (page - 1) * pageSize : 0;
      
      const records = await knex.raw(`
        SELECT 
          id, first_name, email 
        FROM 
          users
        LIMIT :pageSize OFFSET :offset
      `, { pageSize, offset });

      const [{ count: totalRecords }] = await knex.raw(`
        SELECT 
          COUNT(*) AS count 
        FROM 
          users
      `);
      
      return {
        records,
        totalRecords,
      }
    },
  });

  export default () => (
    <TablePage
      columns={[
        {
          label: 'User ID',
          column: 'id',
        },
        {
          label: 'Name',
          column: 'first_name',
        },
        {
          label: 'Email',
          column: 'email',
        },
      ]}
    />
  );
  ```
</details>
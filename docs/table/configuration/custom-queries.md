---
description: "Define custom queries for your Kottster table pages. Learn how to fetch data using raw SQL or external APIs."
---

# Custom queries

By default, Kottster manages data fetching internally. You can also define custom fetching logic, such as using raw SQL or extracting data from an external resource.

To do this, pass an `executeQuery` function to [`defineTableController`](../../table/introduction.md):

```js [app/pages/users/api.server.js]
import { app } from '../../_server/app';
import dataSource from '../../_server/data-sources/postgres';

const controller = app.defineTableController(dataSource, {
  rootTable: {
    executeQuery: async () => {
      // Fetch data here
      const sampleRecords = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
        { id: 3, email: 'user3@example.com' },
      ];

      // Return the records
      return {
        records: sampleRecords,
      };
    },

    // Specify the columns to display in the table
    columns: [
      { column: 'id' },
      { column: 'email' },
    ],
  },
});

export default controller;
```

To enabling pagination, pass a `pageSize` property and return the `totalRecords` property in the `executeQuery` function:

```js [app/pages/users/api.server.js]
const controller = app.defineTableController(dataSource, {
  rootTable: {
    pageSize: 25,
    executeQuery: async ({ page }) => {
      return { 
        records: [/* ... */],
        totalRecords: 100 
      };
    },
  },
});

export default controller;
```

To enable CRUD operations and other built-in table features, the `table` property must be set:

```js [app/pages/users/api.server.js]
const controller = app.defineTableController(dataSource, {
  rootTable: {
    table: 'users',
    executeQuery: async () => {
      // Fetch data here
      const sampleRecords = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
        { id: 3, email: 'user3@example.com' },
      ];

      // Return the records
      return {
        records: sampleRecords,
      };
    },
  },
});

export default controller;
```

## executeQuery

- **Arguments:**

  An object with the following optional properties:

  - **page** (`number`, optional): The current page number, passed if pagination is enabled.
  - **search** (`string`, optional): A search term, passed if search is enabled.

- **Return value:**

  An object with the following properties:

  - **records** (`array`): An array of records to display in the table.
  - **totalRecords** (`number`, optional): The total number of records. Providing this enables pagination.

## Custom SQL query

This example demonstrates how to use a raw SQL query with [Knex](https://knexjs.org/guide/raw.html) to fetch data.

Here we extend the existing table configuration to include a custom query for fetching data from a MySQL, PostgreSQL, or SQLite database. The SQL query is executed using Knex's `raw` method, which allows for raw SQL execution.

::: code-group

```js [MySQL]
import { app } from '../../_server/app';
import dataSource from '../../_server/data-sources/mysql';
import pageSettings from './settings.json';

const pageSize = 25;

const controller = app.defineTableController(dataSource, {
  ...pageSettings,
  rootTable: {
    ...pageSettings.rootTable,
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
    }
  }
});

export default controller;
```

```js [PostgreSQL]
import { app } from '../../_server/app';
import dataSource from '../../_server/data-sources/postgres';
import pageSettings from './settings.json';

const pageSize = 25;

const controller = app.defineTableController(dataSource, {
  ...pageSettings,
  rootTable: {
    ...pageSettings.rootTable,
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
    }
  }
});

export default controller;
```

```js [SQLite]
import { app } from '../../_server/app';
import dataSource from '../../_server/data-sources/sqlite';
import pageSettings from './settings.json';

const pageSize = 25;

const controller = app.defineTableController(dataSource, {
  ...pageSettings,
  rootTable: {
    ...pageSettings.rootTable,
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
    }
  }
});

export default controller;
```

:::


> Please notice that in the examples above, we are using the `raw` method from Knex to execute raw SQL queries. This method has different return formats for each database adapter. For MySQL, it returns an array of records, while for PostgreSQL, it returns an object with a `rows` property containing the records.

## Custom fetching logic

You can also define completely custom fetching logic. For example, you can fetch data from an external API or a different database.

```js [app/pages/users/api.server.js]
import { app } from '../../_server/app';
import dataSource from '../../_server/data-sources/postgres';

const pageSize = 25;

const controller = app.defineTableController(dataSource, {
  rootTable: {
    pageSize,
    
    executeQuery: async ({ page }) => {
      // Fetch data here
      const sampleRecords = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
        { id: 3, email: 'user3@example.com' },
      ];
      
      return {
        records: sampleRecords,
        totalRecords: sampleRecords.length,
      }
    },

    // Specify the columns to display in the table
    columns: [
      { column: 'id' },
      { column: 'email' },
    ],
  }
});

export default controller;
```

## Defining columns

When using custom queries without specifying a `rootTable` configuration, you need to manually define which columns to display in your table. The [`TablePage`](../../ui/table-page-component.md) component cannot automatically determine the available columns, so you must explicitly configure them using the [`columns`](../../ui/table-page-component.md#columns) property.

### Example implementation

Here's an example of how to define columns using the `columns` prop:

```jsx [app/pages/users/index.jsx]
import { TablePage } from '@kottster/react';

export default () => {
  return (
    <TablePage
      columns={[
        { label: 'ID', column: 'id', width: 170 },
        { label: 'First name', column: 'name' },
        { label: 'Email address', column: 'email' },
        { 
          label: 'Created at', 
          column: 'created_at', 
          render: (value) => {
            return new Date(value).toLocaleDateString();
          }
        },
      ]}
    />
  );
};
```

## Adding search

To enable search functionality in your table, you can use the [`withSearch`](../../ui/table-page-component.md#withsearch) property.

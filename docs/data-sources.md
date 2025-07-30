---
description: "Connect to your database in Kottster. Learn how to add data sources, configure tables, and manage permissions."
---

# Connect to database

In Kottster, data sources are the primary way to connect to your database. They allow you to define connections to various databases and configure how Kottster interacts with them.

## Supported data sources

- **[PostgreSQL](https://kottster.app/admin-panel-for-postgresql)**
- **[MySQL](https://kottster.app/admin-panel-for-mysql)**
- **MariaDB**
- **Microsoft SQL Server**
- **[SQLite](https://kottster.app/admin-panel-for-sqlite)**

## Adding a data source

There are three ways to add a data source:

### 1. Using the UI

After creating an app, you’ll land on the "**Getting Started**" page, where you can connect your database. Select the database you want to connect and enter the connection details. Once connected, the data source will be added to your app.

![Connecting to the database using Kottster UI](./connecting-admin-panel-to-db.png)

### 2. Using the CLI

On the same "**Getting Started**" page, you can choose "**Edit file manually**" option to get instructions on how to add a data source using the CLI.

After you execute the command, a folder with the data source will be created in the `_server/data-sources/` directory.

This method is extremely useful if you want to set additional parameters for connection, such as SSL or custom connection options.

## Table configuration

<!-- TODO: check -->

Each data source configuration contains a `tablesConfig` object that allows to define restrictions and permissions for each table globally.

The following table configuration options are available:
- **`excluded`**: Excludes the table from any requests. By default, all tables are included.
- **`excludedColumns`**: Excludes the specified columns from any requests. By default, all columns are included.
- **`preventInsert`**: Prevents the insert operation. By default, insert operations are allowed.
- **`preventUpdate`**: Prevents the update operation. By default, update operations are allowed.
- **`preventDelete`**: Prevents the delete operation. By default, delete operations are allowed.

Example of a data source configuration:

```typescript [app/_server/data-sources/postgres.js]
import { createDataSource } from '@kottster/server';

const dataSource = createDataSource({
  type: DataSourceType.postgres,
  name: 'postgres',
  init: () => {/* ... */},
  tablesConfig: {
    // Configuration for the 'payment_methods' table
    payment_methods: {
      // Excludes the `payment_methods` table from any requests.
      excluded: true,
    },

    // Configuration for the 'users' table
    users: {
      // Excludes the 'password' column from any requests.
      excludedColumns: ['password'],

      // Prevents insertions into the 'users' table.
      preventInsert: true, 

      // Prevents updates to the 'users' table.
      preventUpdate: true,

      // Prevents deletions from the 'users' table.
      preventDelete: true,
    },
  }
});

export default dataSource;
```

By default, if table configuration is not provided, the table is included in all requests.

---
sidebar_position: 3
---

# Data sources

In Kottster, data sources are the primary way to connect to your database. They allow you to define connections to various databases and configure how Kottster interacts with them.

## Adding a data source

There are three ways to add a data source:

### 1. Using the UI

After creating an app, you’ll land on the "**Getting Started**" page, where you can connect your database. Select the database you want to connect and enter the connection details. Once connected, the data source will be added to your app.

### 2. Using the CLI

On the same "**Getting Started**" page, you can choose "**Edit file manually**" option to add a data source using the CLI. 

### 3. Manually

You can also add a data source by creating a new directory in the `server/data-sources` folder and add a `index.js` file inside it. The file should export a function that returns a data source object.

After this, go to `./app/.server/data-sources/registry.js` and add the data source to the registry.

Restart the server to apply the changes.

## Table configuration

Each data source configuration contains a `tablesConfig` object that allows to define restrictions and permissions for each table globally.

The following table configuration options are available:
- **`excluded`**: Excludes the table from any requests. By default, all tables are included.
- **`excludedColumns`**: Excludes the specified columns from any requests. By default, all columns are included.
- **`preventInsert`**: Prevents the insert operation. By default, insert operations are allowed.
- **`preventUpdate`**: Prevents the update operation. By default, update operations are allowed.
- **`preventDelete`**: Prevents the delete operation. By default, delete operations are allowed.

```typescript title="Example"
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
```

By default, if table configuration is not provided, the table is included in all requests.

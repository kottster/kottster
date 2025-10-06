---
description: "Table pages in Kottster let you view and manage data in your database tables. Learn how to create and configure them."
---

# Table pages

Kottster table pages let you **view and manage data** in your database tables.

![Table features in Kottster](table-explanation.png)

**The table pages support a variety of actions, including:**

- Viewing records
- Creating, updating, and deleting records
- Filtering, searching and sorting
- Paginating results
- Viewing and selecting related records
- Creating, updating, and deleting related records

## Page structure

Each table page requires a `page.json` configuration file in its own directory under `app/pages/<pageKey>`. The `<pageKey>` becomes the URL path where your page will be accessible (e.g., `/users` for a page in `./app/pages/users/`).

### Configuration file (`page.json`)
This file defines the table page configuration and is the only required file. You can edit it using the visual builder or modify the file manually.

**Example:**

```json [app/pages/users/page.json]
{
  "type": "table",
  "title": "User Management",
  ...
  "config": {
    // Table configuration goes here
    "table": "users",
    "dataSource": "postgres-db-1",
    "fetchStrategy": "databaseTable",
    ...
  }
}
```

### Optional customization files

If you need additional customization beyond what the visual builder provides, you can add these optional files:

#### Backend controller (`api.server.js`)
This file handles custom backend logic and database interactions. You can modify it when you need custom fetching logic, validations, or hooks beyond what's configured in `page.json`.

**Example:**

```js [app/pages/users/api.server.js]
import { app } from '../../_server/app';

const controller = app.defineTableController({});

export default controller;
```

You basically extend the base configuration from `page.json` with custom logic using [`defineTableController`](./configuration/api.md).

#### Frontend component (`index.jsx`)

The file should export the [`TablePage`](../ui/table-page-component.md) component, which renders the table page and automatically connects to your backend configuration. You can customize the UI and add additional components by passing props to the `TablePage` component.

**Example:**

```jsx [app/pages/users/index.jsx]
import { TablePage } from '@kottster/react'; 

export default () => (
  <TablePage />
);
```

## Creating table pages

You have two options for creating table pages:

### Option 1: Using visual builder (recommended)

The fastest way to create table pages is using Kottster's visual builder. It connects to your database, analyzes tables and relationships, and generates fully functional pages with a single click.

![Adding a table page using the visual builder](./adding-table-page.png)

When you use the visual builder, it creates a `page.json` file with your table configuration. It contains your page configuration and is automatically managed by the visual builder. If you need additional customization beyond what the visual builder offers, you can create optional `api.server.js` and `index.jsx` files as described above.

::: info
The visual builder manages the `page.json` file automatically. Even though you can edit it manually, it's recommended to use the visual builder for creating and configuring table pages. This ensures that all necessary configurations are correctly set up and reduces the risk of errors.
:::

### Option 2: Manual creation

For more control or custom requirements, you can manually create the `page.json` file in your `./app/pages/<pageKey>` directory. Add optional `api.server.js` and `index.jsx` files if needed.

## Examples

Here are some live examples of table pages to see them in action:

* **Users table** - A basic table page for managing users  
  [Live demo](https://demo.kottster.app/users) | [Source code](https://github.com/kottster/live-demo/tree/main/app/pages/users)

* **Instructors table** - Features customized column display and formatting  
  [Live demo](https://demo.kottster.app/instructors) | [Source code](https://github.com/kottster/live-demo/tree/main/app/pages/instructors)

* **Payments table** - Shows extensive related data and complex relationships  
  [Live demo](https://demo.kottster.app/payments) | [Source code](https://github.com/kottster/live-demo/tree/main/app/pages/payments)
---
description: "Add custom columns to Kottster table pages to display additional data. Learn how to create client-side and calculated columns."
---

# Add custom columns

There are many ways to add custom columns to the table. 

## On the client side

**Using the `customColumns` in the `TablePage` component**

If you want to just display a new column in the table, you can use the [`customColumns`](../../ui/table-page-component.md#customcolumns) prop. This is useful for displaying additional information without modifying the existing columns or backend logic.

Add the `customColumns` prop to the `TablePage` component. This prop accepts an array of objects, each representing a custom column.

**Example of a page with a custom column:**

```jsx [app/pages/users/index.jsx]
import { TablePage } from '@kottster/react';

export default () => (
  <TablePage
    customColumns={[
      // Add a custom column to the table
      {
        // The unique key for the new column
        column: 'fullName',

        // The display label for the column
        label: 'Full name',

        // Position of the column, if not specified, it will be added to the end
        position: 1,

        // Render function to display the column content
        render: ({ first_name, last_name }) => `${first_name} ${last_name}`,
      },
    ]}
  />
);
```

Learn more about **columns and their parameters** in the [API reference](../configuration/api.md#columns-1).

## Calculated columns

**Using the visual editor or the `calculatedColumns` in the `defineTableController` function**

For more complex scenarios where you need to perform SQL calculations on the server side, you can use the [`calculatedColumns`](../configuration/api.md#calculatedcolumns) configuration. This is particularly useful for aggregate functions like counting related records or performing mathematical operations.

**Example of a server API with calculated columns:**

```js [app/pages/users/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

const controller = app.defineTableController({
  ...page.config,
  
  // Define columns calculated at the database level with SQL
  calculatedColumns: [
    {
      alias: 'order_count',
      sqlExpression:
        'SELECT COUNT(*) FROM orders WHERE orders.user_id = main.id'
    },
    {
      alias: 'total_revenue',

      // Example of a more complex calculation
      sqlExpression: (`
        SELECT SUM(order_items.price) 
        FROM orders 
        JOIN order_items ON orders.id = order_items.order_id 
        WHERE orders.user_id = main.id
      `)
    }
  ],
});

export default controller;
```

After defining the calculated columns, you can use them in the [`customColumns`](../../ui/table-page-component.md#customcolumns) prop of the [`TablePage`](../../ui/table-page-component.md) component. This allows you to display the calculated values alongside other data in the table.

```jsx [app/pages/users/index.jsx]
import { TablePage } from '@kottster/react';

export default () => (
  <TablePage
    customColumns={[
      // Add custom columns to the table
      {
        column: 'order_count',
        label: 'Order count',
        position: 10,
      },
      {
        column: 'total_revenue',
        label: 'Total revenue',
        position: 11,
        
        // Render function that formats the displayed value
        render: record => `$${record.total_revenue} USD`,
      },
    ]}
  />
);
```
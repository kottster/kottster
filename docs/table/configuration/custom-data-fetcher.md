---
description: "Learn how to use custom data fetchers in Kottster to fetch data for your tables. Use external APIs, or any custom logic to retrieve data."
---

# Custom data fetcher

For table pages in Kottster, you can define custom data fetchers to retrieve data from any source, including external APIs or unsupported databases. This is useful when you want to fetch data that is not directly available in your database or when you need to implement custom logic for data retrieval.

To set up a custom data fetcher, you need to use custom fetch (`customFetch`) as a fetch strategy. This can be configured using the visual editor or by adding a `customDataFetcher` function inside [`defineTableController`](./api.md).

## customDataFetcher function

The `customDataFetcher` function handles the logic for retrieving your data and optionally supports pagination and search.

**Arguments:**

An object with the following optional properties:

- `page` (`number`): The current page number (passed if pagination is enabled)
- `pageSize` (`number`): The number of records per page (passed if pagination is enabled)  
- `search` (`string`, optional): A search term (passed if search is enabled)

**Return value:**

An object with the following properties:

- `records` (`array`): An array of records to display in the table
- `total` (`number`, optional): The total number of records (required for pagination)

## Basic example

Here's a simple custom data fetcher that returns static data:

```js [app/pages/users/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

const controller = app.defineTableController({
  ...page.config,

  customDataFetcher: async () => {
    // Fetch data from any source
    const sampleRecords = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    ];

    return {
      records: sampleRecords,
    };
  },
});

export default controller;
```

## Adding pagination

To enable pagination, return a `total` property with the total number of records:

```js [app/pages/users/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

const controller = app.defineTableController({
  ...page.config,
  
  customDataFetcher: async ({ page, pageSize }) => {
    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;
    
    // Fetch data from external API
    const response = await fetch(
      `https://dummyjson.com/products?limit=${pageSize}&skip=${offset}`
    );
    const data = await response.json();

    return {
      records: data.products,
      total: data.total
    };
  },
});

export default controller;
```

## Adding search functionality

To enable search functionality in your table, you can use the [withSearch](../../ui/table-page-component.md#withsearch) property.

```js [app/pages/products/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

const controller = app.defineTableController({
  ...page.config,
  
  customDataFetcher: async ({ page, pageSize, search }) => {
    const offset = (page - 1) * pageSize;
    let url = `https://dummyjson.com/products?limit=${pageSize}&skip=${offset}`;
    
    // Add search parameter if provided
    if (search) {
      url = `https://dummyjson.com/products/search?q=${encodeURIComponent(search)}&limit=${pageSize}&skip=${offset}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();

    return {
      records: data.products,
      total: data.total
    };
  },
});

export default controller;
```

## Column configuration

When using custom data fetchers, Kottster automatically detects the columns based on the properties of the records returned.
---
description: "Learn how to use custom data fetchers in Kottster to fetch data for your tables. Use external APIs, or any custom logic to retrieve data."
---

# Custom data fetcher

For dashboard pages in Kottster, you can define custom data fetchers to retrieve data from any source, including external APIs or unsupported databases. This is useful when you want to fetch data that is not directly available in your database or when you need to implement custom logic for data retrieval.

## customDataFetcher function

The [`customDataFetcher`](./api.md#customdatafetcher) function handles the logic for retrieving your data.

**Arguments:**

An object with the following optional properties:

- `periodStartDate` (`string`, optional): The start date for the period filter, if enabled (`YYYY-MM-DD` format).
- `periodEndDate` (`string`, optional): The end date for the period filter, if enabled (`YYYY-MM-DD` format).

**Return value for stats:**

An object with the following properties:

- `value` (`number` or `string`): The value to display in the stat.
- `total` (`number` or `string`, optional): The total value for the stat, if applicable.

**Return value for line charts, area charts, and bar charts:**

An object with the following properties:

- `items` (`Array`): An array of objects representing the data points for the chart. Each object should have a date key property and one or more value properties.

  Example structure:

  ```json
  {
    "items": [
      { "date": "2023-01-01", "users_count": 100, "orders_count": 200 },
      { "date": "2023-01-02", "users_count": 150, "orders_count": 250 },
      { "date": "2023-01-03", "users_count": 200, "orders_count": 300 }
    ]
  }
  ```

## Basic example

### Stats

Here's a simple custom data fetcher for a stat

```js [app/pages/analytics/api.server.js]
import { app } from '../../_server/app';

const controller = app.defineDashboardController({
  stats: [
    {
      key: 'stat_1', // Use the key of the stat you want to customize
      fetchStrategy: 'customFetch',
      customDataFetcher: async () => {
        // Fetch data from any source
        const response = await fetch('https://dummyjson.com/users');
        const data = await response.json();

        return {
          value: data.total,
        };
      },
    }
  ],
});

export default controller;
```

### Line charts, area charts, and bar charts

For line charts, area charts, and bar charts, you can define a custom data fetcher that returns an array of data points:

```js [app/pages/analytics/api.server.js]
import { app } from '../../_server/app';

const controller = app.defineDashboardController({
  cards: [
    {
      key: 'card_1', // Use the key of the card you want to customize
      fetchStrategy: 'customFetch',
      customDataFetcher: async () => {
        // Your custom data fetching logic here

        return {
          items: [
            { date: '2023-01-01', users_count: 100, orders_count: 200 },
            { date: '2023-01-02', users_count: 150, orders_count: 250 },
            { date: '2023-01-03', users_count: 200, orders_count: 300 }
          ]
        };
      },
    }
  ],
});

export default controller;
```
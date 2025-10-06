---
description: "Define a dashboard controller in Kottster to handle server-side requests for dashboard pages. Customize statistics, charts, and data visualizations."
---

# Dashboard page configuration

The `defineDashboardController` function creates a server-side controller that handles requests from dashboard pages. It connects to your database and defines what data is available to the dashboard component and how it processes metrics and visualizations.

This function is used in the optional `api.server.js` file within a page directory and should be exported as the default export.

## Basic usage

### Configuring the dashboard

When you need customization beyond what the visual builder provides, you can pass additional configuration options to `defineDashboardController` in the `api.server.js` file.

**Example:**

```tsx [app/pages/dashboard/api.server.js]
import { app } from '../../_server/app';

const controller = app.defineDashboardController({
  // Additional configuration here
  stats: [
    {
      key: 'stat_1', // Use the key of the stat you want to customize
      fetchStrategy: 'customFetch',
      customDataFetcher: async () => {
        // Your custom data fetching logic here

        return {
          value: 1000,
        };
      },
    }
  ],
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
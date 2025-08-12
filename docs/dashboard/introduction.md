---
description: "Dashboard pages in Kottster let you visualize and monitor data through statistics and charts. Learn how to create and configure them."
---

# Dashboard pages

Kottster dashboard pages let you **visualize and monitor data** through statistics blocks and charts.

<!-- ![Dashboard features in Kottster](dashboard-explanation.png) -->

**Dashboard pages support a variety of visualization components, including:**

- Statistics blocks for key metrics
- Line charts for trend analysis
- Area charts for cumulative data
- Bar charts for categorical comparisons

## Page structure

Each dashboard page requires a `page.json` configuration file in its own directory under `app/pages/<pageKey>`. The `<pageKey>` becomes the URL path where your page will be accessible (e.g., `/analytics` for a page in `./app/pages/analytics/`).

### Configuration file (`page.json`)
This file defines the dashboard page configuration and is the only required file. You can edit it using the visual editor or modify the file manually.

**Example:**

```json [app/pages/analytics/page.json]
{
  "type": "dashboard",
  "title": "Analytics Dashboard",
  ...
  "config": {
    // Dashboard configuration goes here
    "stats": [...],
    "cards": [...],
    "withDateRangePicker": true,
    ...
  }
}
```

### Optional customization files

If you need additional customization beyond what the visual editor provides, you can add these optional files:

#### Backend controller (`api.server.js`)
This file handles custom backend logic and data processing. Use this when you need custom data fetching, aggregations, or calculations beyond what's configured in `page.json`.

**Example:**

```js [app/pages/analytics/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

// Default export the controller for handling dashboard requests
const controller = app.defineDashboardController({
  ...page.config,
  // Add custom configuration or logic here
});

export default controller;
```

The backend controller uses [`defineDashboardController`](./configuration/api.md) to extend the base configuration from `page.json` with custom logic.

#### Frontend component (`index.jsx`)
This file defines custom user interface components. Use this when you need to customize the dashboard display or add custom visualizations.

**Example:**

```jsx [app/pages/analytics/index.jsx]
import { DashboardPage } from '@kottster/react'; 

export default () => (
  <DashboardPage />
);
```

The frontend component returns the [`DashboardPage`](../ui/dashboard-page-component.md) component, which automatically connects to your backend configuration. You don't need to pass additional parameters as it's tightly integrated with the backend API.

## Creating dashboard pages

You have two options for creating dashboard pages:

### Option 1: Visual editor (recommended)

The fastest way to create dashboard pages is using Kottster's visual editor. It connects to your database, analyzes available data, and helps you configure statistics and charts with a point-and-click interface.

<!-- ![Adding a dashboard page using the visual editor](./adding-dashboard-page.png) -->

When you use the visual editor, it creates a `page.json` file with your dashboard configuration. It contains your page configuration and is automatically managed by the visual editor. If you need additional customization beyond what the visual editor offers, you can create optional `api.server.js` and `index.jsx` files as described above.

::: info
The visual editor manages the `page.json` file automatically. Even though you can edit it manually, it's recommended to use the visual editor for creating and configuring dashboard pages. This ensures that all necessary configurations are correctly set up and reduces the risk of errors.
:::

### Option 2: Manual creation

For more control or custom requirements, you can manually create the `page.json` file in your `./app/pages/<pageKey>` directory. Add optional `api.server.js` and `index.jsx` files only if you need additional customization beyond the base dashboard functionality.
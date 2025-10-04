---
description: "Define a dashboard controller in Kottster to handle server-side requests for dashboard pages. Customize statistics, charts, and data visualizations."
---

# API Reference

The `defineDashboardController` function creates a server-side controller that handles requests from dashboard pages. It connects to your database and defines what data is available to the dashboard component and how it processes metrics and visualizations.

This function is used in the optional `api.server.js` file within a page directory and should be exported as the default export.

## Basic usage

**Example:**

```tsx [app/pages/dashboard/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

const controller = app.defineDashboardController({
  ...page.config,
});

export default controller;
```

### Extending page configuration

When you need customization beyond what the visual builder provides, you can add additional configuration to the `page.json` settings in the controller file.

**Example:**

```tsx [app/pages/dashboard/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

const controller = app.defineDashboardController({
  ...page.config,
  // Add additional configuration here
});

export default controller;
```
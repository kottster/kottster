---
sidebar_position: 1
sidebar_label: Introduction
---

# Custom pages

Kottster lets you create pages with custom content and business logic. You can use them to create dashboards, reports, forms, or any other type of page you need.

You can define both the **backend logic and the user interface in a single file**. The backend logic is responsible for handling requests from the user interface, while the user interface defines how the page looks and behaves.

**The most common use cases for custom pages include**:
- **Dashboards**: Create a custom dashboard with charts, tables, and other components.
- [**Requests to external API**](/custom-pages/using-external-api): Make requests to an external API (REST, GraphQL, etc.).
- **Requests to non-supported data sources**: Make requests to a data source that is not supported by Kottster.
- **Information pages**: Create information pages with articles, guides, or other content.
- **Forms**: Create custom forms with validation and submission logic.
- **Reports**: Create custom reports with data visualization and export options.

## Simple page

You can define just the frontend part of the custom page without any backend logic. The following example shows how to create a simple custom page that just displays a message.

```tsx title="app/routes/my-custom-page/index.jsx"
import { Page } from '@kottster/react';

export default () => {
  return (
    <Page title='My custom page'>
      Hello, world!
    </Page>
  );
};
```

## Page with API

But if you need to fetch data from the backend, you can define a custom controller that will handle requests from the frontend.

This is an example of a simple custom page that fetches a message from the backend and displays it on the frontend. 
The action function `generateMessage` is accessible from the frontend using the [`executeCustomAction`](/custom-pages/api#client-side-usage) function.

```tsx title="app/routes/my-custom-page/index.jsx"
import { useEffect, useState } from 'react';
import { executeCustomAction, Page, usePage } from '@kottster/react';
import { app } from '../../.server/app';

// Backend part.
// Here we define a custom controller that will handle requests.
export const action = app.defineCustomController({
  generateMessage: async ({ name }) => { 
    return `Hello, ${name}!`;
  },
});

// Frontend part.
// Here we return a React component that will be rendered as a page.
export default () => {
  const { navItem } = usePage();
  const [message, setMessage] = useState(null);

  const fetchMessage = async () => {
    const res = await executeCustomAction('generateMessage', {
      name: 'John',
    });

    setMessage(res);
  };

  useEffect(() => {
    fetchMessage();
  }, []);

  return (
    <Page title={navItem.name}>
      <b>Message</b>: {message}
    </Page>
  );
};
```

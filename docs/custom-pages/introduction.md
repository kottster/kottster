# Custom pages

Kottster lets you create pages with custom content and business logic. You can use them to create dashboards, reports, forms, or any other type of page you need.

## Page structure

Each custom page should have its own directory under `./app/pages/<key>` containing at least one file. The `<key>` becomes the URL path where your page will be accessible (e.g., `/dashboard` for a page in `./app/pages/dashboard/`).

### Frontend component (`index.jsx`)
This file defines your page's user interface and exports a React component.

### Backend controller (`api.server.js`)
This file handles server-side logic and API endpoints for your page. Only needed if your page requires backend functionality.

## Simple page

You can create a basic custom page with just the frontend component. This example creates a simple welcome page that displays a static message.

**Example:**

```tsx [app/pages/welcome/index.jsx]
import { Page } from '@kottster/react';

export default () => {
  return (
    <Page title='Welcome'>
      <h1>Hello, world!</h1>
      <p>Welcome to your custom Kottster page!</p>
    </Page>
  );
};
```

## Page with API

When you need to fetch data from a backend API, you can add a custom controller by creating an `api.server.js` file in the same directory as your page component. The controller uses [`defineCustomController`](./api.md) to set up custom API endpoints for your page.

This example creates a page that displays the file path of the current page. It demonstrates how to call backend procedures from the frontend and handle loading states and errors.

### Backend controller

First, create the backend controller that defines the API functions:

**Example:**

```tsx [app/pages/example/api.server.js]
import { app } from '../../_server/app';

const controller = app.defineCustomController({
  getFilePath: async (data) => {
    // Return the file path for the current page
    return `${process.cwd()}/app/pages/${data.id}/index.jsx`;
  },
});

export default controller;
```

The `getFilePath` function receives data from the frontend (in this case, the page ID) and returns the file system path where the page component is located.

### Frontend component

Then, create the frontend component that calls the backend API:

**Example:**

```tsx [app/pages/example/index.jsx]
import { useEffect, useState } from 'react';
import { Page, usePage, useCallProcedure } from '@kottster/react';
import { Center, Stack, Text, Code, Loader } from '@mantine/core';

export default () => {
  // Hook to call backend procedures for the current page
  const callProcedure = useCallProcedure();
  
  // Get the current page ID
  const { pageId } = usePage();
  
  const [filePath, setFilePath] = useState();
  const [loading, setLoading] = useState(true);
  
  const fetchFilePath = async () => {
    try {
      // Call the backend procedure defined in api.server.js
      const data = await callProcedure('getFilePath', { id: pageId });
      setFilePath(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilePath(); // Fetch the file path when the component mounts
  }, [pageId]);

  return (
    <Page>
      <Center h='80vh'>
        <Stack align='center' gap='md'>
          {loading ? (
            <Loader />
          ) : (
            <Code block>{filePath}</Code>
          )}
        </Stack>
      </Center>
    </Page>
  );
};
```

This page component does the following:
1. **Fetches data on load**: When the page loads, it automatically calls the `getFilePath` backend procedure
2. **Shows loading state**: Displays a spinner while waiting for the API response
3. **Displays the result**: Shows the file path in a code block once loaded

The backend procedures defined in your controller are accessible from the frontend using the [`useCallProcedure`](../ui/use-call-procedure-hook.md) hook. This hook provides a clean way to make type-safe calls to your backend procedures.

## Type-safe API calls

You can get full type safety for your API calls by exporting the controller types from your backend file and importing them in your frontend component. This ensures that parameters and return values of your server API are properly typed.

### Backend with types

**Example:**

```tsx [app/pages/example/api.server.ts]
import { app } from '../../_server/app';

const controller = app.defineCustomController({
  getFilePath: async (data: { id: string }) => {
    return `${process.cwd()}/app/pages/${data.id}/index.jsx`;
  },
});

// Export the types for TypeScript support
export type Procedures = typeof controller.procedures;

export default controller;
```

### Frontend with type safety

**Example:**

```tsx [app/pages/example/index.tsx]
import { useEffect, useState } from 'react';
import { Page, usePage, useCallProcedure } from '@kottster/react';
import { Center, Stack, Text, Code, Loader } from '@mantine/core';
import { type Procedures } from './api.server';

export default () => {
  // Get fully typed procedure calls
  const callProcedure = useCallProcedure<Procedures>();
  const { pageId } = usePage();
  const [filePath, setFilePath] = useState<string>();
  const [loading, setLoading] = useState(true);
  
  const fetchFilePath = async () => {
    try {
      // TypeScript will now validate the function name and parameters
      const data = await callProcedure('getFilePath', { id: pageId });
      setFilePath(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilePath();
  }, [pageId]);

  return (
    <Page>
      <Center h='80vh'>
        <Stack align='center' gap='md'>
          {loading ? (
            <Loader />
          ) : (
            <Code block>{filePath}</Code>
          )}
        </Stack>
      </Center>
    </Page>
  );
};
```

With this setup, TypeScript will provide autocomplete for function names, validate parameter types, and ensure return type safety for all your backend procedures.

## Examples

Here are some live examples of custom pages to see them in action:

* **Analytics Dashboard** - Dashboard with stats and interactive charts  
  [Live demo](https://demo.kottster.app/analyticsDashboard) | [Source code](https://github.com/kottster/live-demo/tree/main/app/pages/analyticsDashboard)

* **Growth Chart** - Custom page featuring a detailed growth visualization  
  [Live demo](https://demo.kottster.app/growthChart) | [Source code](https://github.com/kottster/live-demo/tree/main/app/pages/growthChart)

* **Control Panel** - Settings page with various configuration options  
  [Live demo](https://demo.kottster.app/controlPanel) | [Source code](https://github.com/kottster/live-demo/tree/main/app/pages/controlPanel)
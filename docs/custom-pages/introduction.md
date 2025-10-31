# Custom pages

Kottster lets you create pages with custom content and business logic. You can use them to create dashboards, reports, forms, or any other type of page you need.

## Page structure

Each custom page should have its own directory under `./app/pages/<key>` containing at least one file. The `<key>` becomes the URL path where your page will be accessible (e.g., `/dashboard` for a page in `./app/pages/dashboard/`).

### Frontend component (`index.jsx`)

This file defines your page's user interface and exports a React component.

### Backend controller (`api.server.js`)

This file handles server-side logic and API endpoints for your page. Only needed if your page requires backend functionality.

## Simple page

You can create a basic custom page by adding an `index.jsx` (or `index.tsx`) file in a page directory. This example creates a simple welcome page that displays a static message.

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

When you need a backend API, you can add a custom controller by creating an `api.server.js` (or `api.server.ts`) file in the same directory as your page component. The controller uses [`defineCustomController`](./api.md) to set up custom API endpoints for your page.

**Example:**

::: code-group

```tsx [JavaScript]
import { app } from '../../_server/app';
import postgresDataSource from '../../_server/data-sources/postgres_db';

const knex = postgresDataSource.getClient();

const controller = app.defineCustomController({
  getPost: async ({ postId }) => {
    const post = await knex('posts').where({ id: postId }).first();
    if (!post) {
      throw new Error('Post not found');
    }

    return post;
  },
});

export default controller;
```

```tsx [TypeScript]
import { app } from '../../_server/app';
import postgresDataSource from '../../_server/data-sources/postgres_db';

interface GetPostInput {
  postId: number;
}

export interface Post {
  id: number;
  title: string;
  content: string;
}

const knex = postgresDataSource.getClient();

const controller = app.defineCustomController({
  getPost: async ({ postId }: GetPostInput): Promise<Post> => {
    const post = await knex('posts').where({ id: postId }).first();
    if (!post) {
      throw new Error('Post not found');
    }

    return post;
  },
});

export type Procedures = typeof controller.procedures;

export default controller;
```

:::

The `getPost` procedure fetches a post from the database table posts using [knex](https://knexjs.org/guide/query-builder.html) based on the provided `postId` parameter.

After defining the backend controller, you can call its procedures from your frontend component using the [`useCallProcedure`](../custom-pages/calling-api.md) hook.

**Example:**

::: code-group

```tsx [JavaScript]
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Page, usePage, useCallProcedure } from '@kottster/react';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get postId from URL query parameters
  const postId = Number(searchParams.get('postId'));

  // Hook to call backend procedures for the current page
  const callProcedure = useCallProcedure(); // [!code highlight]

  const [post, setPost] = useState();
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    try {
      // Call the backend procedure defined in api.server.js
      const data = await callProcedure('getPost', { postId }); // [!code highlight]
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost(); // Fetch the post when the component mounts
  }, [postId]);

  return (
    <Page>
      {loading ? (
        <Loader />
      ) : (
        <>
          <h1>{post?.title}</h1>
          <p>
            {post?.content}
          </p>
        </>
      )}
    </Page>
  );
};
```

```tsx [TypeScript]
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Page, usePage, useCallProcedure } from '@kottster/react';
import { Center, Stack, Text, Code, Loader } from '@mantine/core';
import { type Procedures, type Post } from './api.server'; // [!code highlight]

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get postId from URL query parameters
  const postId = Number(searchParams.get('postId'));

  // Hook to call backend procedures for the current page
  const callProcedure = useCallProcedure<Procedures>(); // [!code highlight]

  const [post, setPost] = useState<Post>();
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    try {
      // Call the backend procedure defined in api.server.js
      const data = await callProcedure('getPost', { postId }); // [!code highlight]
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost(); // Fetch the post when the component mounts
  }, [postId]);

  return (
    <Page>
      {loading ? (
        <Loader />
      ) : (
        <>
          <h1>{post?.title}</h1>
          <p>
            {post?.content}
          </p>
        </>
      )}
    </Page>
  );
};
```

:::

This page component does the following:
1. **Fetches data on load**: When the page loads, it automatically calls the `getPost` procedure with the `postId` from the URL query parameters
2. **Shows loading state**: Displays a spinner while waiting for the API response
3. **Displays the result**: Shows the post title and content once loaded

## Examples

Here are some live examples of custom pages to see them in action:

* **Analytics Dashboard** - Dashboard with stats and interactive charts  
  [Live demo](https://demo.kottster.app/analyticsDashboard) | [Source code](https://github.com/kottster/live-demo/tree/main/app/pages/analyticsDashboard)

* **Growth Chart** - Custom page featuring a detailed growth visualization  
  [Live demo](https://demo.kottster.app/growthChart) | [Source code](https://github.com/kottster/live-demo/tree/main/app/pages/growthChart)

* **Control Panel** - Settings page with various configuration options  
  [Live demo](https://demo.kottster.app/controlPanel) | [Source code](https://github.com/kottster/live-demo/tree/main/app/pages/controlPanel)
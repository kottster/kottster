---
sidebar_position: 3
---

# Using external API

This page shows how to define [custom controllers](/custom-pages/api#custom-controller) to make requests to an external API (REST, GraphQL, etc.) and return the data to the frontend.

## Example with `fetch`

The following example shows how to use the `fetch` API to make a request to an external API and return the data to the frontend:

```tsx title="app/routes/my-custom-page.jsx"
import { executeCustomAction, Page, usePage } from '@kottster/react';
import { app } from '../.server/app';
import { useEffect, useState } from 'react';

export const action = app.defineCustomController({
  getProducts: async () => {
    // Make a request to the external REST endpoint
    const res = await fetch(`https://dummyjson.com/products`);
    const data = await res.json();

    return {
      products: data.products,
      total: data.total,
    };
  }
});

export default () => {
  const { navItem } = usePage();
  const [data, setData] = useState({
    products: [],
    total: 0,
  });

  const fetchProducts = async () => {
    const res = await executeCustomAction('getProducts');

    setData(res);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Page title={navItem.name}>
      <ul>
        {data.products.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </Page>
  );
};
```

## Example with Apollo Client

You can define an Apollo Client instance inside a separate file:

```tsx title="app/apollo-client.js"
import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://my-graphql-api.example.com',
  cache: new InMemoryCache(),
});

export default client;
```

Then, you can use this client to make requests to a GraphQL API:

```tsx title="app/routes/my-custom-page.jsx"
import { executeCustomAction, Page, usePage } from '@kottster/react';
import { app } from '../.server/app';
import { useEffect, useState } from 'react';
import client from '../apollo-client';

export const action = app.defineCustomController({
  getPosts: async () => {
    // Make a request to the GraphQL API
    const res = await client.query({
      query: gql`
        query {
          posts {
            id
            title
          }
        }
      `,
    });

    return res.data.posts;
  }
});

export default () => {
  const { navItem } = usePage();
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    const res = await executeCustomAction('getPosts');

    setPosts(res);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <Page title={navItem.name}>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </Page>
  );
};
```

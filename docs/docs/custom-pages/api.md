---
sidebar_position: 2
---

# API Reference

## Custom controller

The `defineCustomController` function sets up a custom controller to handle request from the page. Inside the controller you can define multiple server-side actions that could be used to fetch data from the database, [external API](/custom-pages/using-external-api), or perform any other operation on the backend.

The object returned by `defineCustomController` **should always** be exported as `action` from the file.

```typescript title="Example"
import { app } from '../.server/app';

export const action = app.defineCustomController({
  getProduct: async () => {
    // Inside this function you can fetch data 
    // from the database, external API, static file, etc.

    // And return data to the frontend.
    return {
      id: 1,
      name: 'Product 1',
      price: 100,
    };
  },
});

// Frontend part
export default () => { /* ... */ };
```

Each action function should be defined inside the object passed to `defineCustomController`. The function should be `async` and return data that will be sent to the frontend.

### Arguments

Each action function can accept two arguments:

- `input`: An object with parameters passed from the frontend.
- `ctx`: An object with the request context, including `user`:
  - `user`: The user object with the `id` and `email` properties.
  - `req`: The HTTP request object.

### Examples

```typescript title="Example of an action with arguments"
export const action = app.defineCustomController({
  getProduct: async ({ id }) => {
    // Fetch product by id from the database
    const product = await db.products.findOne({ id });

    // Return product data to the frontend
    return product;
  },
});
```

```typescript title="Example of an action with context"
export const action = app.defineCustomController({
  getCurrentUser: async (_, { user }) => {
    // Fetch user by id from the database
    const user = await db.users.findOne({ id: user.id });

    // Return user data to the frontend
    return user;
  },
});
```

```typescript title="Example of an action withouth arguments"
export const action = app.defineCustomController({
  getProducts: async () => {
    // Fetch all products from the database
    const products = await db.products.find();

    // Return products data to the frontend
    return products;
  },
});
```

## Client-side usage

To call the action from the frontend, use the `executeCustomAction` function. 

### Arguments

The function accepts two arguments:
- `actionName`: The name of the action defined in the custom controller.
- `input`: An object with parameters that will be passed to the action.

### Examples

```typescript title="Example"
import { app } from '../.server/app';
import { executeCustomAction } from '@kottster/react';

export const action = app.defineCustomController({
  getProduct: async ({ id }) => {/* ... */},
});

export default () => {
  const fetchProduct = async () => {
    // Call the getProduct action with id parameter
    const product = await executeCustomAction('getProduct', { id: 1 });
    console.log(product);
  };

  return (
    <Page title='My custom page'>
      <button onClick={fetchProduct}>Fetch product</button>
    </Page>
  );
};
```
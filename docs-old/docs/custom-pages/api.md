---
sidebar_position: 2
---

# Server API

## Custom controller

The `defineCustomController` function sets up a custom controller to handle requests from the page. Inside the controller you can define multiple server-side functions that can be used to fetch data from the database, external API, or perform any other operation on the backend.

The controller **should always** be exported as default from the `api.server.js` file.

```typescript title="app/pages/products/api.server.js"
import { app } from '../../_server/app';

const controller = app.defineCustomController({
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

export default controller;
```

Each function should be defined inside the object passed to `defineCustomController`. The function should be `async` and return data that will be sent to the frontend.

### Arguments

Each function can accept two arguments:

- `input`: An object with parameters passed from the frontend.
- `ctx`: An object with the request context, including `user`:
  - `user`: The user object with the `id` and `email` properties.
  - `req`: The HTTP request object.

### Examples

**Example of a server procedure with input parameters:**

```typescript title="app/pages/products/api.server.js"
const controller = app.defineCustomController({
  getProduct: async ({ id }) => {
    // Fetch product by id from the database
    const product = await db.products.findOne({ id });

    // Return product data to the frontend
    return product;
  },
});

export default controller;
```

**Example of a server procedure with context access:**

```typescript title="app/pages/products/api.server.js"
const controller = app.defineCustomController({
  getAddedProducts: async (_, { user }) => {
    // Fetch products added by the current user
    const products = await db.products.find({ userId: user.id });

    // Return products data to the frontend
    return products;
  },
});

export default controller;
```

**Example of a server procedure without any arguments:**

```typescript title="app/pages/products/api.server.js"
const controller = app.defineCustomController({
  getProducts: async () => {
    // Fetch all products from the database
    const products = await db.products.find();

    // Return products data to the frontend
    return products;
  },
});

export default controller;
```

### Type-safety

If you are using TypeScript, you can define your API functions with type safety. This allows you to specify the types of input parameters and return values, which helps catch errors at compile time and provides better IntelliSense support in your IDE.

Example of a TypeScript controller with typed functions:

```typescript title="app/pages/products/api.server.ts"
import { app } from '../../_server/app';

interface Product {
  id: number;
  name: string;
  price: number;
  userId: string;
}

interface GetProductInput {
  id: number;
}

const controller = app.defineCustomController({
  getProduct: async ({ id }: GetProductInput): Promise<Product | null> => {
    const product = await db.products.findOne({ id });
    return product;
  },
  
  getProducts: async (): Promise<Product[]> => {
    const products = await db.products.find();
    return products;
  },
  
  createProduct: async ({ name, price }: { name: string; price: number }, { user }): Promise<Product> => {
    const product = await db.products.create({
      name,
      price,
      userId: user.id,
    });
    return product;
  },
});

// Export types for frontend usage
export type Procedures = typeof controller.procedures;

export default controller;
```
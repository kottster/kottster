# Server API

## Custom controller

The `defineCustomController` function sets up a custom controller to handle requests from the page. Inside the controller you can define multiple server-side functions that can be used to fetch data from the database, external API, or perform any other operation on the backend.

The controller **should always** be exported as default from the `api.server.js` (or `api.server.ts`) file.

Example of a custom controller defined in `app/pages/products/api.server.js` and `app/pages/products/api.server.ts`:

::: code-group

```javascript [JavaScript]
import { app } from '../../_server/app';

const controller = app.defineCustomController({
  getProducts: async () => {
    // Inside this function you can fetch data 
    // from the database, external API, static file, etc.

    // And return data to the frontend.
    return [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 },
    ];
  },
});

export default controller;
```

```typescript [TypeScript]
import { app } from '../../_server/app';

interface Produce {
  id: number;
  name: string;
  price: number;
}

const controller = app.defineCustomController({
  getProducts: async (): Promise<Product[]> => {
    // Inside this function you can fetch data
    // from the database, external API, static file, etc.

    // And return data to the frontend.
    return [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 },
    ];
  },
});

// The Procedures type can be used on the frontend 
// to get type-safety when calling server procedures.
export type Procedures = typeof controller.procedures;

export default controller;
```

:::

Each function should be defined inside the object passed to `defineCustomController`. The function should be `async` and return data that will be sent to the frontend.

### Arguments

Each function can accept two arguments:

- **input**: `input` - An object with parameters passed from the frontend.
- **context**: [`ProcedureContext`](https://kottster.app/api-reference/types/_kottster_server.ProcedureContext.html) - An object with the request context, including information about the current user, request, and other relevant data.
  - **user**: [`user`](https://kottster.app/api-reference/types/_kottster_common.AppContext.html#user) - The user object with the `id` and `email` properties.
  - **req**: [`req`](https://kottster.app/api-reference/types/_kottster_common.AppContext.html#user) - The HTTP request object.

### Examples

**Example of a server procedure that fetches data from the database:**

::: code-group

```javascript [JavaScript]
import { app } from '../../_server/app';

// Get Knex client from the defined Postgres data source
const knex = postgresDataSource.getClient();

const controller = app.defineCustomController({
  getProduct: async ({ productId }) => {
    // Fetch product by id from the database
    const product = await knex('products').where({ id: productId }).first();

    // Return product data to the frontend
    return product;
  },
});

export default controller;
```

```typescript [TypeScript]
import { app } from '../../_server/app';
import postgresDataSource from '../../_server/data-sources/postgres_db';

interface GetProductInput {
  productId: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

// Get Knex client from the defined Postgres data source
const knex = postgresDataSource.getClient();

const controller = app.defineCustomController({
  getProduct: async ({ productId }: GetProductInput): Promise<Product | null> => {
    // Fetch product by id from the database
    const product = await knex('products').where({ id: productId }).first();

    // Return product data to the frontend
    return product;
  },
});

// The Procedures type can be used on the frontend 
// to get type-safety when calling server procedures.
export type Procedures = typeof controller.procedures;

export default controller;
```

:::

**Example of a server procedure with context access:**

::: code-group

```javascript [JavaScript]
import { app } from '../../_server/app';
import postgresDataSource from '../../_server/data-sources/postgres_db';

const knex = postgresDataSource.getClient();

const controller = app.defineCustomController({
  getMyProducts: async (_, { user }) => {
    // Fetch products added by the current user
    const products = await knex('products').where({ user_id: user.id });

    // Return products data to the frontend
    return products;
  },
});

export default controller;
```

```typescript [TypeScript]
import { app } from '../../_server/app';
import postgresDataSource from '../../_server/data-sources/postgres_db';

interface Product {
  id: number;
  name: string;
  price: number;
}

const knex = postgresDataSource.getClient();

const controller = app.defineCustomController({
  getMyProducts: async (_, { user }): Promise<Product[]> => {
    // Fetch products added by the current user
    const products = await knex('products').where({ user_id: user.id });

    // Return products data to the frontend
    return products;
  },
});

// The Procedures type can be used on the frontend 
// to get type-safety when calling server procedures.
export type Procedures = typeof controller.procedures;

export default controller;
```

:::
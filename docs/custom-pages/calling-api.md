# Calling API

## Basic usage

The [`useCallProcedure`](https://kottster.app/api-reference/functions/_kottster_react.useCallProcedure.html) hook returns a function that allows you to call backend procedures defined in your custom controller.

Example of a custom page in `app/pages/products/index.jsx`:

::: code-group

```tsx [JavaScript]
import { useCallProcedure, Page } from '@kottster/react';

export default () => {
  // Get the callProcedure function
  const callProcedure = useCallProcedure(); // [!code highlight]

  const handleClick = async () => {
    // Call the backend procedure
    const result = await callProcedure('getProducts'); // [!code highlight]
    console.log(result);
  };

  return (
    <Page>
      <button onClick={handleClick}>
        Load Products
      </button>
    </Page>
  );
};
```

```tsx [TypeScript]
import { useCallProcedure, Page } from '@kottster/react';
import { type Procedures } from './api.server';// [!code highlight]

export default () => {
  // Get the typed callProcedure function
  const callProcedure = useCallProcedure<Procedures>(); // [!code highlight]

  const handleClick = async () => {
    // Call the backend procedure
    const result = await callProcedure('getProducts'); // [!code highlight]
    console.log(result);
  };

  return (
    <Page>
      <button onClick={handleClick}>
        Load Products
      </button>
    </Page>
  );
};
```

:::

## Passing parameters

You can pass parameters to your backend procedures as the second argument:

::: code-group

```tsx [JavaScript]
import { useState } from 'react';
import { useCallProcedure, Page } from '@kottster/react';

export default () => {
  const callProcedure = useCallProcedure(); // [!code highlight]
  const [product, setProduct] = useState(null);

  const loadProduct = async (productId) => {
    // Pass parameters in the second argument
    const result = await callProcedure('getProduct', { id: productId }); // [!code highlight]
    setProduct(result);
  };

  return (
    <Page>
      <button onClick={() => loadProduct(1)}>
        Load Product 1
      </button>
      {product && (
        <div>
          <h3>{product.name}</h3>
          <p>Price: ${product.price}</p>
        </div>
      )}
    </Page>
  );
};
```

```tsx [TypeScript]
import { useState } from 'react';
import { useCallProcedure, Page } from '@kottster/react';
import { type Procedures } from './api.server'; // [!code highlight]

export default () => {
  const callProcedure = useCallProcedure<Procedures>(); // [!code highlight]
  const [product, setProduct] = useState(null);

  const loadProduct = async (productId) => {
    // Pass parameters in the second argument. It is fully type-safe
    const result = await callProcedure('getProduct', { id: productId }); // [!code highlight]
    setProduct(result);
  };

  return (
    <Page>
      <button onClick={() => loadProduct(1)}>
        Load Product 1
      </button>
      {product && (
        <div>
          <h3>{product.name}</h3>
          <p>Price: ${product.price}</p>
        </div>
      )}
    </Page>
  );
};
```

:::

## Using TanStack React Query

[TanStack React Query](https://tanstack.com/query/latest) provides powerful data fetching capabilities like caching, background updates, and optimistic updates. You can easily integrate it with `useCallProcedure`:

```tsx [TypeScript]
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallProcedure, Page } from '@kottster/react';
import { type Procedures } from './api.server'; // [!code highlight]

export default () => {
  const callProcedure = useCallProcedure<Procedures>(); // [!code highlight]
  const queryClient = useQueryClient();

  // Get products using React Query
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => callProcedure('getProducts'), // [!code highlight]
  });

  // Mutation for creating a new product
  const createProductMutation = useMutation({
    mutationFn: (newProduct: { name: string; price: number }) =>
      callProcedure('createProduct', newProduct),
    onSuccess: () => {
      // Invalidate and refetch products after successful creation
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Mutation for deleting a product
  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) =>
      callProcedure('deleteProduct', { id: productId }),
    onSuccess: () => {
      // Invalidate and refetch products after successful deletion
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleCreateProduct = () => {
    createProductMutation.mutate({
      name: 'New Product',
      price: 99.99,
    });
  };

  const handleDeleteProduct = (productId: number) => {
    deleteProductMutation.mutate(productId);
  };

  if (isLoading) return <Page><div>Loading...</div></Page>;

  return (
    <Page title="Products">
      <button
        onClick={handleCreateProduct}
        disabled={createProductMutation.isPending}
      >
        {createProductMutation.isPending ? 'Creating...' : 'Add Product'}
      </button>

      <ul>
        {products?.map(product => (
          <li key={product.id}>
            {product.name} - ${product.price}
            <button
              onClick={() => handleDeleteProduct(product.id)}
              disabled={deleteProductMutation.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </Page>
  );
};
```
# Calling API

Once you've defined your custom controller in the `api.server.js` file, you can call those functions from your frontend component using the `useCallProcedure` hook.

## Basic usage

The `useCallProcedure` hook provides a simple way to call your backend procedures from React components:

```tsx [app/pages/products/index.jsx]
import { useCallProcedure, Page } from '@kottster/react';

export default () => {
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

## Passing parameters

You can pass parameters to your backend procedures as the second argument:

```tsx [app/pages/products/index.jsx]
import { useState } from 'react';
import { useCallProcedure, Page } from '@kottster/react';

export default () => {
  const callProcedure = useCallProcedure(); // [!code highlight]
  const [product, setProduct] = useState(null);

  const loadProduct = async (productId) => {
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

## Error handling

Always wrap your API calls in try-catch blocks to handle potential errors:

```tsx [app/pages/products/index.jsx]
import { useState } from 'react';
import { useCallProcedure, Page } from '@kottster/react';

export default () => {
  const callProcedure = useCallProcedure(); // [!code highlight]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await callProcedure('getProducts'); // [!code highlight]
      setProducts(result);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <button onClick={loadProducts} disabled={loading}>
        {loading ? 'Loading...' : 'Load Products'}
      </button>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <ul>
        {products.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </Page>
  );
};
```

## Using with useEffect

For data that needs to be loaded when the component mounts, use `useEffect`:

```tsx [app/pages/products/index.jsx]
import { useEffect, useState } from 'react';
import { useCallProcedure, Page } from '@kottster/react';

export default () => {
  const callProcedure = useCallProcedure(); // [!code highlight]
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await callProcedure('getProducts'); // [!code highlight]
        setProducts(result);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return <Page><div>Loading...</div></Page>;
  }

  return (
    <Page title="Products">
      <ul>
        {products.map(product => (
          <li key={product.id}>{product.name} - ${product.price}</li>
        ))}
      </ul>
    </Page>
  );
};
```

## Type-safe calls

For TypeScript projects, import the `Procedures` type from your API server to get full type safety:

```tsx [app/pages/products/index.tsx]
import { useEffect, useState } from 'react';
import { useCallProcedure, Page } from '@kottster/react';

// Import the Procedures type from your API server file
import { type Procedures } from './api.server';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default () => {
  // Get fully typed procedure calls
  const callProcedure = useCallProcedure<Procedures>(); // [!code highlight]
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // TypeScript will validate function names and parameters
        const result = await callProcedure('getProducts'); // [!code highlight]
        setProducts(result);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const createProduct = async () => {
    try {
      // TypeScript will enforce the correct parameter structure
      const newProduct = await callProcedure('createProduct', { // [!code highlight]
        name: 'New Product', // [!code highlight]
        price: 99.99 // [!code highlight]
      }); // [!code highlight]
      setProducts([...products, newProduct]);
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  if (loading) {
    return <Page><div>Loading...</div></Page>;
  }

  return (
    <Page title="Products">
      <button onClick={createProduct}>Add Product</button>
      <ul>
        {products.map(product => (
          <li key={product.id}>{product.name} - ${product.price}</li>
        ))}
      </ul>
    </Page>
  );
};
```

## Using with TanStack React Query

[TanStack React Query](https://tanstack.com/query/latest) provides powerful data fetching capabilities like caching, background updates, and optimistic updates. You can easily integrate it with `useCallProcedure`:

### Basic query

```tsx [app/pages/products/index.tsx]
import { useQuery } from '@tanstack/react-query';
import { useCallProcedure, Page } from '@kottster/react';
import { type Procedures } from './api.server';

export default () => {
  const callProcedure = useCallProcedure<Procedures>(); // [!code highlight]

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => callProcedure('getProducts'), // [!code highlight]
  });

  if (isLoading) return <Page><div>Loading products...</div></Page>;
  if (error) return <Page><div>Error: {error.message}</div></Page>;

  return (
    <Page title="Products">
      <ul>
        {products?.map(product => (
          <li key={product.id}>{product.name} - ${product.price}</li>
        ))}
      </ul>
    </Page>
  );
};
```

### Query with parameters

For queries that depend on parameters, use the parameter as part of the query key:

```tsx [app/pages/product-details/index.tsx]
import { useQuery } from '@tanstack/react-query';
import { useCallProcedure, usePage, Page } from '@kottster/react';
import { type Procedures } from './api.server';

export default () => {
  const callProcedure = useCallProcedure<Procedures>(); // [!code highlight]
  const { pageKey } = usePage();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', pageKey],
    queryFn: () => callProcedure('getProduct', { id: parseInt(pageKey) }), // [!code highlight]
    enabled: !!pageKey, // Only run query if pageKey exists
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Page>
      <h1>{product?.name}</h1>
      <p>Price: ${product?.price}</p>
    </Page>
  );
};
```

### Mutations

Use `useMutation` for create, update, and delete operations:

```tsx [app/pages/products/index.tsx]
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallProcedure, Page } from '@kottster/react';
import { type Procedures } from './api.server';

export default () => {
  const callProcedure = useCallProcedure<Procedures>(); // [!code highlight]
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => callProcedure('getProducts'), // [!code highlight]
  });

  const createProductMutation = useMutation({
    mutationFn: (newProduct: { name: string; price: number }) =>
      callProcedure('createProduct', newProduct),
    onSuccess: () => {
      // Invalidate and refetch products after successful creation
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) =>
      callProcedure('deleteProduct', { id: productId }),
    onSuccess: () => {
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

React Query automatically handles caching, background refetching, and error recovery, making your custom pages more robust and performant.

The `useCallProcedure` hook automatically handles the connection to your custom controller and provides a clean, type-safe interface for calling your backend procedures.
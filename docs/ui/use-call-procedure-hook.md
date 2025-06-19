# useCallProcedure hook

The `useCallProcedure` hook is a custom React hook that returns the function to call a server procedure of the current page. This hook is useful for manually invoking server procedures from client-side code.

## Returned Value

- **callProcedure**: `function` - A function that takes the procedure name and an optional payload, and returns a promise that resolves with the result of the procedure call.

  The function accepts the following parameters:
  - **procedure**: `string` - The name of the server procedure to call.
  - **input**: `object` (optional) - The payload to send with the procedure call. This can be any object that the server procedure expects.

## Example Usage

```jsx
import { useCallProcedure } from '@kottster/react';

export default () => {
  const callProcedure = useCallProcedure(); // [!code highlight]

  const handleClick = async () => {
    try {
      const result = await callProcedure('myProcedure', { key: 'value' }); // [!code highlight]
      console.log('Procedure result:', result);
    } catch (error) {
      console.error('Error calling procedure:', error);
    }
  };

  return (
    <button onClick={handleClick}>
      Call Server Procedure
    </button>
  );
};
```

See more examples in [the documentation](../custom-pages/calling-api.md).
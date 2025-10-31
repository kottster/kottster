---
description: "Use the useUser hook to get the current authenticated user in Kottster."
---

# useUser hook

The [`useUser`](https://kottster.app/api-reference/functions/_kottster_react.useUser.html) hook is a custom React hook that returns the current authenticated user.

**Example usage:**

```jsx [app/pages/example/index.jsx]
import { Page, useUser } from '@kottster/react';

export default () => {
  const { user } = useUser();

  return (
    <Page>
      Current User Email: {user.email}
    </Page>
  );
};
```

## Returned values

- **user**: [`object`](https://kottster.app/api-reference/interfaces/_kottster_react.ClientIdentityProviderUserWithRoles.html) - The current user object, which includes all public properties of the user.
- **permissions**: `string[]` - An array of permissions associated with the current user.
- **hasRole**: `(role: string) => boolean` - A function that checks if the current user has a specific role.
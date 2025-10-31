---
description: "Use the useApp hook to get application data in Kottster."
---

# useApp hook

The [`useApp`](https://kottster.app/api-reference/functions/_kottster_react.useApp.html) hook is a custom React hook that returns the application data, including the schema, pages, and other relevant information.

**Example usage:**

```jsx [app/pages/example/index.jsx]
import { Page, useApp } from '@kottster/react';

export default () => {
  const { stage } = useApp();

  return (
    <Page>
      App is Running in Stage: {stage}
    </Page>
  );
};
```

## Returned values

- **stage**: `"production" | "development"` - The current stage of the application.
- **schema**: [`ClientAppSchema`](https://kottster.app/api-reference/interfaces/_kottster_react.ClientAppSchema.html) - The overall schema of the app.
- **roles**: [`ClientIdentityProviderRole[]`](https://kottster.app/api-reference/interfaces/_kottster_react.ClientIdentityProviderRole.html) - An array of roles defined in the application.
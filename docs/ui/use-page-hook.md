---
description: "Use the usePage hook to get the current page ID and navigation item in Kottster."
---

# usePage hook

The `usePage` hook is a custom React hook that returns the current page ID and navigation item.

Example usage:

```jsx [app/pages/example/index.jsx]
import { Page, usePage } from '@kottster/react';

export default () => {
  const { pageKey, page } = usePage(); // [!code highlight]

  return (
    <Page>
      Current Page ID: {pageKey} <br />
      Current Page: {page ? page.title : 'No page found'}
    </Page>
  );
};
```

## Returned Values

- **pageKey**: `string` - The ID of the current page.
- **page**: `object` - The current page object, which includes all public properties of the page configuration.
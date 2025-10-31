---
description: "Use the usePage hook to get the current page key and page object in Kottster."
---

# usePage hook

The [`usePage`](https://kottster.app/api-reference/functions/_kottster_react.usePage.html) hook is a React hook that returns the current page ID and the page object.

**Example usage:**

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

## Returned values

- **pageKey**: `string` - The ID of the current page.
- **page**: [`object`](https://kottster.app/api-reference/types/_kottster_react.PublicPage.html) - The current page object, which includes all public properties of the page configuration.
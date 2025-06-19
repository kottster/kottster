# usePage hook

The `usePage` hook is a custom React hook that returns the current page ID and navigation item.

Example usage:

```jsx title="app/pages/example/index.jsx"
import { Page, usePage } from '@kottster/react';

export default () => {
  const { pageId, navItem } = usePage(); // [!code highlight]

  return (
    <Page>
      Current Page ID: {pageId} <br />
      Current Nav Item: {navItem ? navItem.label : 'No nav item found'}
    </Page>
  );
};
```

## Returned Values

- **pageId**: `string` - The ID of the current page.
- **navItem**: `object` - The navigation item associated with the current page, containing:
  - **id**: `string` - The page ID associated with the navigation item.
  - **label**: `string` - The label of the navigation item.
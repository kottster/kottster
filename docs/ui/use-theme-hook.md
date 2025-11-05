---
description: "Use the useTheme hook to get and set the current theme in Kottster."
---

# useTheme hook

The [`useTheme`](https://kottster.app/api-reference/functions/_kottster_react.useTheme.html) hook is a React hook that returns the current theme (dark or light) of the application, and the a function to set the theme.

**Example usage:**

```jsx [app/pages/example/index.jsx]
import { Page, useTheme } from '@kottster/react';

export default () => {
  const { theme, setTheme } = useTheme(); // [!code highlight]

  return (
    <Page>
      {theme === 'dark' ? (
        <button onClick={() => setTheme('light')}>Switch to Light Theme</button>
      ) : (
        <button onClick={() => setTheme('dark')}>Switch to Dark Theme</button>
      )}
    </Page>
  );
};
```

## Returned values

- **theme**: `"dark" | "light"` - The current theme of the application.
- **setTheme**: `(theme: "dark" | "light") => void` - A function to set the theme of the application.
---
description: "Add custom actions to Kottster table pages to enhance workflows. Learn how to create client-side actions, auto-calling server procedures, and manually calling server procedures."
---

# Add actions

![Example of custom actions in Kottster](./example-custom-actions.png)

Kottster provides default actions for working with records (view, edit, delete), but you can add custom actions for specific workflows. There are three ways to add custom actions:

- **Client-side actions** - For simple UI interactions that don't need server processing
- **Auto-calling server procedures** - For server operations that run automatically when clicked
- **Manually calling server procedures** - For server operations where you need custom logic before/after the call

## Client-side actions

Use client-side actions for simple interactions like showing alerts, opening modals, or navigating to other pages.

```jsx [app/pages/users/index.jsx]
import { TablePage } from '@kottster/react';

export default () => (
  <TablePage
    customActions={[
      {
        label: 'View Profile',
        onClick: (record) => {
          // Simple client-side logic
          window.open(`https://example.com/profile/${record.id}`, '_blank');
        },
      },
    ]}
  />
);
```

## Auto-calling server procedures

Use this approach when you need server-side processing (like sending emails or updating data) and want the procedure to run automatically when the button is clicked.

```jsx [app/pages/users/index.jsx]
import { TablePage } from '@kottster/react';
import { notifications } from '@mantine/notifications';

export default () => (
  <TablePage
    customActions={[
      {
        label: 'Send Welcome Email',
        procedure: 'sendWelcomeEmail', // This procedure runs automatically
        onResult: (result) => {
          if (result.success) {
            notifications.show({
              title: 'Success',
              message: 'Welcome email sent!',
              color: 'green',
            });
          }
        },
      },
    ]}
  />
);
```

**Define the server procedure:**

```js [app/pages/users/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

const controller = app.defineTableController({
  ...page.config
}, {
  sendWelcomeEmail: async (record) => {
    console.debug(`[server] Sending welcome email to ${record.email}`);
    
    return { success: true };
  }
});

export default controller;
```

## Manually calling server procedures

Use this approach when you need custom logic before or after calling the server procedure, such as showing confirmation dialogs, validating data, custom error handling, or chaining multiple operations.

```jsx [app/pages/users/index.jsx]
import { TablePage, useCallProcedure } from '@kottster/react';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';

export default () => {
  const callProcedure = useCallProcedure();

  const handleSendEmail = (record) => {
    // Show confirmation before calling the server
    modals.confirm({
      title: 'Send Email',
      children: `Send welcome email to ${record.email}?`,
      labels: { confirm: 'Send', cancel: 'Cancel' },
      onConfirm: async () => {
        // Manually call the same server procedure
        const result = await callProcedure('sendWelcomeEmail', record);
        
        if (result.success) {
          notifications.show({
            title: 'Success',
            message: 'Email sent successfully!',
            color: 'green',
          });
        }
      },
    });
  };

  return (
    <TablePage
      customActions={[
        {
          label: 'Send Welcome Email',
          onClick: handleSendEmail,
        },
      ]}
    />
  );
};
```

## When to use each approach

- **Client-side actions**: Navigation, showing/hiding UI elements, client-side data filtering
- **Auto-calling procedures**: Simple server operations like sending emails, generating reports, or updating status
- **Manual procedure calls**: When you need confirmation dialogs, data validation, or complex workflows before or after the server call

Learn more about actions and their parameters in the [API reference](../configuration/api.md).
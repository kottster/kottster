---
description: "Instructions for upgrading Kottster to version 3.2, which introduces full self-hosting capabilities."
---

# Upgrade to v3.2

With the release of [Kottster v3.2](https://kottster.app/blog/kottster-is-now-fully-self-hosted), Kottster is now **fully self-hosted**, including authentication, user management, and app management. This change removes the need for external services and lets you run Kottster completely offline.  

## Recommended upgrade path

The easiest and most reliable way to upgrade is to **create a new project from scratch** using the [Getting Started guide](./index.md). After that, move over any files you created in your old project, such as:  
- pages
- data sources  
- and other custom files

This ensures you start with a clean v3.2 setup while keeping your existing work.  

## Main changes

The most important change is in your **`app/_server/app.js`** file.  
Identity provider initialization is now required and must be configured directly.  

Here is the new structure:  

```ts
import { createApp, createIdentityProvider } from '@kottster/server';
import schema from '../../kottster-app.json';

export const app = createApp({
  schema,
  secretKey: '<your-secret-key>',
  
  // Will be added when creating a new project.
  // You can remove this if you don't use 
  // the additional features requiring external API
  kottsterApiToken: '<your-kottster-api-token>',

  /*
   * The identity provider configuration.
   * See https://kottster.app/docs/app-configuration/identity-provider
   */
  identityProvider: createIdentityProvider('sqlite', {
    fileName: 'app.db',

    passwordHashAlgorithm: 'bcrypt',
    jwtSecretSalt: '<your-jwt-secret-salt>',

    /* The root admin user credentials */
    rootUsername: '<your-root-username>',
    rootPassword: '<your-root-password>',
  }),
});
```

You can learn more about identity providers and their configuration on the [Identity provider](./app-configuration//identity-provider.md) documentation page.
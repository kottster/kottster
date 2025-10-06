---
description: "Deploy your Kottster app from local development to production. Learn how to prepare your admin panel and explore hosting options."
---

# Deploying

This guide walks you through deploying your Kottster app from local development to a production environment. You'll learn how to prepare your admin panel for deployment and explore common hosting options.

## Requirements

Before deployment, ensure your environment meets these prerequisites:

- [Node.js](https://nodejs.org/en) (version v20 or above)
- [npm](https://www.npmjs.com/get-npm) (comes with Node.js) or any other preferred package manager

## Before you deploy

### Use environment variables for secrets

We recommend **using environment variables** to set secret keys and other sensitive information. This prevents accidental exposure in your code or version control.

Open `app/_server/app.js` and update it to use environment variables for the following settings:

```javascript [app/_server/app.js]
import { createApp, createIdentityProvider } from '@kottster/server';
import schema from '../../kottster-app.json';

export const app = createApp({
  schema,
  secretKey: process.env.SECRET_KEY || '<your-secret-key>', // [!code highlight]

  identityProvider: createIdentityProvider('sqlite', {
    fileName: 'app.db',

    passwordHashAlgorithm: 'bcrypt',
    jwtSecretSalt: process.env.JWT_SECRET_SALT || '<your-jwt-secret-salt>', // [!code highlight]
    
    /* The root admin user credentials */
    rootUsername: 'admin',
    rootPassword: process.env.ROOT_USER_PASSWORD || 'adminpass', // [!code highlight]
  }),
});
```

For a better approach, use `NODE_ENV` to set different values for development and production, and use `getEnvOrThrow` to ensure required variables are actually set in production:

```javascript [app/_server/app.js]
import { getEnvOrThrow } from '@kottster/common';
import { createApp, createIdentityProvider } from '@kottster/server';
import schema from '../../kottster-app.json';

const isProduction = process.env.NODE_ENV === 'production';

const SECRET_KEY = getEnvOrThrow('SECRET_KEY');
const JWT_SECRET_SALT = getEnvOrThrow('JWT_SECRET_SALT');
const ROOT_USER_PASSWORD = getEnvOrThrow('ROOT_USER_PASSWORD');

export const app = createApp({
  schema,
  secretKey: isProduction // [!code highlight]
    ? SECRET_KEY // [!code highlight]
    : '<your-secret-key>', // [!code highlight]

  identityProvider: createIdentityProvider('sqlite', {
    fileName: 'app.db',

    passwordHashAlgorithm: 'bcrypt',
    jwtSecretSalt: isProduction // [!code highlight]
      ? JWT_SECRET_SALT // [!code highlight]
      : '<your-jwt-secret-salt>', // [!code highlight]

    /* The root admin user credentials */
    rootUsername: 'admin',
    rootPassword: isProduction // [!code highlight]
      ? ROOT_USER_PASSWORD // [!code highlight]
      : 'adminpass', // [!code highlight]
  }),
});
```

> **Note:** `NODE_ENV` is automatically set to `development` when running `npm run dev` and `production` when running `npm run start`.

Do not forget to **use environment variables for your database connection details** as well. See the [Database access and security](./security/database-access.md#production-best-practices) section for more details.

## Running in production

**Before starting the app in production mode, you need to build it first:**

```
npm run build
```

This compiles the app and stores it in the `build` directory. 

**Once built, you can start the app in production mode:**

```
npm run start
```

You can change the port by setting the `PORT` environment variable. By default, it will run on port `3000`.

The `NODE_ENV` environment variable is set to `production` by default when you run `npm run build` and `npm run start`. This means that the production app will be optimized for performance and will not support live changes to the code, pages, or configuration.

### Run Docker container

Alternatively, you can run your app in a Docker container. Learn more about how to run your Kottster app using Docker on the [Quickstart with Docker](./quickstart-docker.md) page.

## Deployment options

Kottster is a Node.js app, so you can deploy it to any hosting provider that supports Node.js. Some providers run the app as a traditional server, while others use serverless solutions. The serverless option is easier to set up and usually cheaper, but it might not work for all use cases.

### Popular cloud providers

- **<a href="https://digitalocean.com" rel="nofollow" target="_blank">DigitalOcean</a>**: <a href="https://www.digitalocean.com/community/tutorials/deploy-apps-with-custom-domain#what-is-digitalocean-app-platform" rel="nofollow" target="_blank">Build and Deploy Apps on DigitalOcean App Platform</a>

- **<a href="https://heroku.com" rel="nofollow" target="_blank">Heroku</a>**: <a href="https://devcenter.heroku.com/articles/deploying-nodejs" rel="nofollow" target="_blank">Deploying Node.js Apps on Heroku</a>

- **<a href="https://railway.app" rel="nofollow" target="_blank">Railway</a>**: <a href="https://alphasec.io/how-to-deploy-a-nodejs-app-on-railway/" rel="nofollow" target="_blank">How to Deploy a Node.js App on Railway</a>

- **<a href="https://cloud.google.com/run" rel="nofollow" target="_blank">Google Cloud Run</a>**: <a href="https://cloud.google.com/run/docs/quickstarts/deploy-container" rel="nofollow" target="_blank">Quickstart: Deploy a Container (Node.js Example)</a>

- **<a href="https://aws.amazon.com" rel="nofollow" target="_blank">AWS (Elastic Beanstalk)</a>**: <a href="https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs_express.html" rel="nofollow" target="_blank">Deploying a Node.js Express application to Elastic Beanstalk</a>

- **<a href="https://azure.microsoft.com" rel="nofollow" target="_blank">Azure App Service</a>**: <a href="https://learn.microsoft.com/en-us/azure/app-service/quickstart-nodejs?tabs=windows&pivots=development-environment-vscode" rel="nofollow" target="_blank">Deploy a Node.js Web App</a>
---
description: ""
---

# App configuration

## Using the `kottster-app.json`

In the root of your Kottster app, you project has a `kottster-app.json` file. This file is used to configure various aspects of your Kottster application, that are both shared between the server and client.

### id

`string`, required

The `id` property is a unique identifier for your Kottster app. It could be a UUID or any other unique string. This ID is used internally by Kottster to distinguish between different applications.

### basePath

`string`, optional

The `basePath` property defines the base URL path for your Kottster app. This is useful when deploying your app under a specific subdirectory on your server.

### meta.name

`string`, required

The `meta.name` property specifies the display name of your Kottster app. This name is shown near the app icon in the Kottster interface.

### meta.icon

`string`, required

The `meta.icon` property defines the URL of the icon image for your Kottster app. This icon is displayed alongside the app name in the Kottster interface. Learn more about icons in the [Branding documentation](../app-configuration/branding.md#logo).

## Using the `app/_server/app.js`

The `app/_server/app.js` file allows you to define server-side configurations, secrets, and custom logic for your Kottster app. All the code in this file runs only on the server, ensuring that sensitive information remains secure.

### secretKey

`string`, required

The `secretKey` property is used for signing and verifying tokens, such as JWTs (JSON Web Tokens). This key should be kept secret and not exposed to the client side.

::: info
We recommend to move sensitive configuration like `secretKey` to environment variables for enhanced security. Learn more about best practices for managing secrets in the [Deployment documentation](../deploying.md#before-you-deploy).
:::

### rootUsername

`string`, optional

The `rootUsername` property defines the username for the root (admin) user of your Kottster app. This user has full access to all features and settings within the app.

### rootPassword

`string`, optional

The `rootPassword` property defines the password for the root (admin) user of your Kottster app. This password should be kept secure and not exposed to the client side.

::: info
We recommend to move sensitive configuration values like `rootPassword` to environment variables for enhanced security. Learn more about best practices for managing secrets in the [Deployment documentation](../deploying.md#before-you-deploy).
:::

### rootCustomPermissions

`string[]`, optional

The `rootCustomPermissions` property allows you to specify additional custom permissions for the root (admin) user. This can be useful for granting specific access rights that are not covered by the default admin permissions.

### jwtSecretSalt

`string`, required

The `jwtSecretSalt` property is used as a salt value for hashing JWTs (JSON Web Tokens). This adds an extra layer of security to the token generation and verification process.

::: info
We recommend to move sensitive configuration like `jwtSecretSalt` to environment variables for enhanced security. Learn more about best practices for managing secrets in the [Deployment documentation](../deploying.md#before-you-deploy).
:::

### kottsterApiToken

`string`, optional

The `kottsterApiToken` property is used to specify an API token for external requests to the Kottster app. These requests are being done for additional functionalities, such as check available updates and generate SQL queries using AI.

### postAuthMiddleware

`function`, optional

The `postAuthMiddleware` property allows you to define a custom middleware function that runs after the user is authenticated. This can be useful for implementing additional security checks or logging.

Learn more: [Creating custom validation middleware](./identity-provider.md#custom-validation-middleware)

## Environment variables

You can also configure your Kottster app using environment variables. There are plenty of environment variables that Kottster supports for configuring various aspects of your app.

You can provide them in a `.env` file in the root of your Kottster app, or set them directly in your deployment environment.

| Environment Variable | Description |
|----------------------|-------------|
| `PORT` | Port number for the Kottster app when running in production (default: `3000`) |
| `DEV_API_SERVER_URL` | URL for the development API server (default: `http://localhost:5481`) |
| `DEBUG_MODE` | Enable debug mode for more verbose logging (default: `false`) |
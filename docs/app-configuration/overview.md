---
description: "Learn how to configure your Kottster app using the source configuration files and environment variables."
---

# App configuration

## Using the `kottster-app.json`

The `kottster-app.json` file in your project root configures settings that both server and client share.

### id

`string`, required

A unique identifier for your Kottster app. Use a UUID or any unique string. Kottster uses this ID internally to distinguish between different applications.

### basePath

`string`, optional

Defines the base URL path for your Kottster app. Use this when deploying your app in a subdirectory on your server.

### meta.name

`string`, required

The display name of your Kottster app. This appears next to the app icon in the Kottster interface.

### meta.icon

`string`, required

The URL of your app's icon image. This icon appears alongside the app name in the Kottster interface. Learn more about icons in the [Branding documentation](../app-configuration/branding.md#logo).

## Using the `app/schemas/sidebar.json`

### menuPageOrder

`string[]`, optional

Defines the order of pages in the app's sidebar menu. List the page IDs in the desired order to customize the navigation experience for users.

## Using the `app/_server/app.js`

The `app/_server/app.js` file defines server-side configurations, secrets, and custom logic for your Kottster app. All code in this file runs only on the server, keeping sensitive information secure.

### secretKey

`string`, required

Used for signing and verifying tokens like JWTs (JSON Web Tokens). Keep this key secret and never expose it to the client side.

::: info
Move sensitive configuration like `secretKey` to environment variables for better security. Learn more about managing secrets in the [Deployment documentation](../deploying.md#before-you-deploy).
:::

### rootUsername

`string`, optional

The username for your app's root (admin) user. This user has full access to all features and settings within the app.

### rootPassword

`string`, optional

The password for your app's root (admin) user. Keep this password secure and never expose it to the client side.

::: info
Move sensitive values like `rootPassword` to environment variables for better security. Learn more about managing secrets in the [Deployment documentation](../deploying.md#before-you-deploy).
:::

### rootCustomPermissions

`string[]`, optional

Specifies additional custom permissions for the root (admin) user. Use this to grant specific access rights beyond the default admin permissions.

### jwtSecretSalt

`string`, required

A salt value for hashing JWTs (JSON Web Tokens). This adds extra security to token generation and verification.

::: info
Move sensitive configuration like `jwtSecretSalt` to environment variables for better security. Learn more about managing secrets in the [Deployment documentation](../deploying.md#before-you-deploy).
:::

### kottsterApiToken

`string`, optional

An API token for external requests to the Kottster app. This enables additional features like checking for updates and generating SQL queries using AI.

### postAuthMiddleware

`function`, optional

A custom middleware function that runs after user authentication. Use this for additional security checks or logging.

Learn more: [Creating custom validation middleware](./identity-provider.md#custom-validation-middleware)

## Environment variables

Configure your Kottster app using environment variables.

Provide them in a `.env` file in your project root, or set them directly in your deployment environment.

| Environment Variable | Description |
|----------------------|-------------|
| `PORT` | Port number for the Kottster app in production (default: `3000`) |
| `DEV_API_SERVER_URL` | URL for the development API server (default: `http://localhost:5481`) |
| `DEBUG_MODE` | Enables debug mode for verbose logging (default: `false`) |
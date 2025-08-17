---
description: "Customize your Kottster app's branding with a unique name, logo, and other visual elements."
---

# Branding

Kottster is a full-stack application with a React frontend. While you can customize individual pages however you want, you can also customize the overall app branding to match your brand or project identity.

## App name

To change your app's name, edit the `kottster-app.json` file and modify the `meta.name` property. This name will appear throughout your app in headers, page titles, and other UI elements.

**Example:**
```json
{
  "id": "123",
  "meta": {
    "name": "Your Custom App Name",
    "icon": "https://web.kottster.app/icon.png"
  },
  ...
}
```

## Logo

You can customize your app's logo by updating the `meta.icon` property in `kottster-app.json`. 

### Using an external URL

By default, the logo points to `https://web.kottster.app/icon.png` (the default Kottster icon). You can replace this with any external image URL:

```json
{
  "id": "123",
  "meta": {
    "name": "Admin Panel",
    "icon": "https://example.com/your-logo.png"
  },
  ...
}
```

### Using a local file

For better performance and reliability, you can store your logo locally:

1. Create a `public` directory in your project root (if it doesn't exist)
2. Add your logo file (e.g., `logo.png`) to the `public` directory
3. Reference it in your configuration using a relative path:

```json
{
  "id": "123",
  "meta": {
    "name": "Admin Panel",
    "icon": "/logo.png"
  },
  ...
}
```

::: tip
Make sure your logo image is optimized for web use and works well at different sizes across your application.
:::
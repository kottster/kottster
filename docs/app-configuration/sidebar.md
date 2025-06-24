---
description: "Customize your Kottster app's sidebar navigation with unique items and icons."
---

# Sidebar

The sidebar navigation is the main way users move through your Kottster app. You can customize the navigation items to match your app's structure and functionality.

## Managing navigation items

### Visual interface

The easiest way to customize your sidebar is through the visual interface, where you can add, sort, edit, and delete navigation items.

### Manual configuration

You can also edit navigation items directly in the `kottster-app.json` file by modifying the `navItems` array.

## Navigation item structure

Each navigation item contains three required properties:

```json
{
  "id": "users",
  "name": "Users", 
  "icon": "users"
}
```

- **`id`** - Unique identifier for the navigation item
- **`name`** - Display name shown in the sidebar
- **`icon`** - Icon displayed next to the name

## Available icons

You can choose from the following built-in icons for your navigation items: `users`, `award`, `box`, `briefcase`, `pieChart`, `barChart2`, `shoppingBag`, `creditCard`, `cloud`, `mapPin`, `bookOpen`, `table`, and `sliders`.

## Example configuration

Here's a complete example of a sidebar configuration:

```json
{
  "id": "123",
  "meta": {
    "name": "Admin Panel",
    "logo": "/logo.png"
  },
  "navItems": [
    {
      "id": "dashboard",
      "name": "Dashboard",
      "icon": "pieChart"
    },
    {
      "id": "users",
      "name": "Users",
      "icon": "users"
    },
    {
      "id": "orders",
      "name": "Orders",
      "icon": "shoppingBag"
    },
    {
      "id": "settings",
      "name": "Settings",
      "icon": "sliders"
    }
  ]
}
```

## Page titles

By default, pages automatically use the title from their corresponding navigation item's `name`. If there's no matching navigation item, you'll need to specify the title explicitly:

- For [`Page`](../ui/page-component.md) components, use the [`title`](../ui/page-component.md#title) prop
- For [`TablePage`](../ui/table-page-component.md) components, use the [`title`](../ui/table-page-component.md#title) prop
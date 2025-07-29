---
description: "Customize your Kottster app's sidebar navigation with unique items and icons."
---

# Sidebar

The sidebar navigation is the main way users move through your Kottster app. You can customize the navigation items to match your app's structure and functionality. The sidebar will only show pages that users have access to based on their assigned roles.

## Managing navigation items

### Visual interface

The easiest way to customize your sidebar is through the visual interface, where you can add, edit, and manage pages while specifying whether each page should be visible in the sidebar along with its icon.

### Manual configuration

You can also control sidebar visibility directly in each page's `page.json` config file located in `app/pages/<key>/page.json`. Here you can specify the icon and whether the page should be visible in the sidebar.

## Page configuration

Each page can be configured with sidebar settings in its `page.json` file:

```json
{
  "type": "custom",
  "title": "Analytics Dashboard",
  "icon": "pieChart", // [!code highlight]
  "hideInSidebar": false, // [!code highlight]
  ...
}
```

- `icon` - Icon displayed next to the page name in the sidebar
- `hideInSidebar` - Set to `true` to hide the page from sidebar navigation

By default, any page is visible in the sidebar and gets a default icon.

## Available icons

You can choose from the following built-in icons for your navigation items: `users`, `award`, `box`, `briefcase`, `pieChart`, `barChart2`, `shoppingBag`, `creditCard`, `cloud`, `mapPin`, `bookOpen`, `table`, and `sliders`.
---
description: "Control user access to your Kottster app with roles and permissions. Set up page access and table operation permissions."
---

# Roles and permissions

Kottster uses a role-based access control system where users are assigned roles, and these roles can have specific permissions. This allows you to control what parts of your app users can access and what actions they can perform.

## How it works

The system is built around two key concepts:

- **Roles** - Groups that users can be assigned to (e.g., Admin, Project Manager, Support)
- **Permissions** - Specific actions or access rights that can be granted to roles

Based on these roles, you can define which parts of your app users have access to. You can restrict access to specific pages and control permissions for creating, updating, and deleting records in table pages.

## Setting up page access

You can control which roles have access to specific pages using the visual builder. This can be done when creating a new page or editing an existing one. For [table pages](../table/introduction.md), you can additionally control permissions for creating, updating, and deleting records based on user roles.

## Root user

When you first launch your Kottster app, you'll set up a username and password for the root administrator account. These credentials are stored in your app's configuration and provide unrestricted access to all features and user management capabilities.

**Best practice:** Reserve the root account for initial setup and critical administrative tasks only. For day-to-day operations, create specific user roles with appropriately scoped permissions.

**Note:** The root user inherits all permissions and roles by default, regardless of what's explicitly defined in your roles and permissions configuration.

For more information about root user setup and identity provider configuration, see the [Identity Provider](../app-configuration/identity-provider.md) documentation.
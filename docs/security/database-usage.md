---
description: "How Kottster interacts with your database without impacting performance. Learn about schema caching, data operations, and more."
---

# Database usage

Kottster is designed to have no performance impact on your connected database. Here's exactly how it works with your data.

## Lightweight database interaction

Kottster only queries your database when users actively interact with the app, using simple, efficient queries that don't affect your database performance.

## How it works

### Schema caching
When your Kottster app starts up:
- Extracts your database schema: information about tables, columns, and relationships
- Caches this information in memory or in a local file during development
- This cache persists until you manually restart the app

After the initial schema extraction, Kottster app doesn't need to query your database structure again until the next restart.

### Data operations

**Table views**: When a user opens a table view, Kottster runs multiple SELECT queries to the target table and its related tables to display the data.

**CRUD operations**: All basic Create, Update, and Delete operations run as single queries to your database. It happens only when users intentionally perform these actions.

### Data privacy

Your database credentials and connection details are stored locally within your Kottster app and are never shared with our platform or any external services. Learn more about [how Kottster accesses your database](./database-access.md). The database data is only accessible by your app’s backend, ensuring that all data operations are secure and private.

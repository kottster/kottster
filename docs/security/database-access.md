---
description: "Learn how Kottster securely accesses your database, ensuring complete control and privacy."
---

# Access to database

The Kottster app is designed with security and privacy as core principles. As a self-hosted solution, your database credentials and connection details remain completely within your control and never leave your app environment.

**This architecture ensures that:**

- Your database credentials are never exposed to external services
- No third-party service has direct access to your database
- You maintain complete ownership and control over your data access

## How database access works

### Local storage only

When you add a data source to your Kottster app, all connection information is stored locally within your Kottster app. **The database connection and connection details are kept inside the app** and are **never shared with our platform or any external services**.

### Data flow

**Your database is only accessible by your app’s backend.** When the frontend needs data, it sends a request to your backend, which then queries the database. This way, **all data goes through only your own app API**, keeping your database private and secure.

### Database schema extraction

Your local Kottster app automatically extracts and stores database schema information (tables, columns, and relationships) locally when the app is running. This local schema extraction enables enhanced development features while maintaining complete data privacy.

**What your local app extracts and stores:**

- Table names and structures
- Column names and data types
- Relationships between tables
- Database schema organization

**How it works in development:**

When you generate new pages during development mode, your local app includes this locally-stored schema information in the request to our platform (external API). This allows the page generator to create appropriate page structures and components that match your database design.

This approach ensures that database schema information is only shared when you actively request page generation.

### Complete control

The content of these connection files can be modified according to your development needs. You have full control over:

- Connection parameters
- Authentication details
- Database configuration options
- Any custom settings required for your specific setup

## Production best practices

### Environment variables

For production deployments, we strongly recommend moving connection details (credentials or connection strings) to environment variables. This approach provides additional security and makes it easier to manage different environments.

Here's an example of how to implement this:

```javascript
import { createDataSource, KnexPgAdapter } from '@kottster/server';
import knex from 'knex';

const dataSource = createDataSource({
  type: 'postgres',
  name: 'postgres',
  init: () => {
    const client = knex({
      client: 'pg',
      connection: process.env.NODE_ENV === 'development' 
        ? 'postgresql://myuser:mypassword@localhost:5432/mydatabase' 
        : process.env.DB_CONNECTION,
      searchPath: ['public'],
    });

    return new KnexPgAdapter(client);
  },
  tablesConfig: {}
});

export default dataSource;
```

### Additional security configurations

If you need to add restrictions for particular operations, tables, or columns, you should configure these additional security measures in your data source setup.

**Learn more:** [Connect to database - Table Configuration](../data-sources.md#table-configuration)

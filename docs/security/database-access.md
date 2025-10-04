---
description: "Learn how Kottster securely accesses your database, ensuring complete control and privacy."
---

# Access to database

The Kottster app is designed with security and privacy as core principles. As a self-hosted solution, your database credentials and connection details remain completely within your control and never leave your app environment.

**This architecture ensures that:**

- Your database credentials are **never exposed to external services**
- Our platform **does not access your database**
- You maintain **complete ownership and control** over your data access

## How database access works

### Local storage only

When you add a data source to your Kottster app, all connection information is stored locally within your Kottster app. <span style="color: #099268;">**The database connection and connection details are kept inside the app**</span> and are <span style="color: #099268;">**never shared with our platform or any external services**</span>.

### Data flow

<span style="color: #099268;">**Your database is only accessible by your app’s backend.**</span> When the frontend needs data, it sends a request to your backend, which then queries the database. This way, the data flow is <span style="color: #099268;">**entirely contained within your app**</span>, ensuring that your database remains private and secure.

### Database schema extraction

Your local Kottster app automatically extracts and stores database schema information (tables, columns, and relationships) locally when the app is running. This local schema extraction enables enhanced development features while maintaining complete data privacy.

**What your local app extracts and stores:**

- Table names and structures
- Column names and data types
- Relationships between tables
- Database schema organization

**How it works in development:**

In visual builder, you can use optional features that requires making requests to our platform (external API), such as generating SQL queries using AI or create pages using ready-to-use page templates. 

When you use such features, your local app includes this locally-stored schema information in the request to Kottster API.

This approach ensures that database schema information is only shared when you actively use features that require it. <span style="color: #099268;">**Your actual database credentials, connection details or stored data are not accessible by our platform or any external services.**</span>

### Complete control

The content of these data source connection files in `app/_server/data-sources/` can be modified according to your development needs. You have full control over:

- Connection parameters
- Authentication details
- Database configuration options
- Any custom settings required for your specific setup

## Production best practices

### Environment variables

For production deployments, we strongly recommend moving connection details (credentials or connection strings) to environment variables. This approach provides additional security and makes it easier to manage different environments.

Here's an example data source configuration:

```javascript [app/_server/data-sources/postgres.js]
import { KnexPgAdapter } from '@kottster/server';
import knex from 'knex';

const client = knex({
  client: 'pg',
  connection: process.env.NODE_ENV === 'development' // [!code highlight]
    ? 'postgresql://myuser:mypassword@localhost:5432/mydatabase' // [!code highlight]
    : process.env.DB_CONNECTION, // [!code highlight]
  searchPath: ['public'],
});

export default new KnexPgAdapter(client);
```

Learn more about how to prepare your app for production in the [Deploying Kottster](../deploying.md#before-you-deploy) documentation.

### Additional security configurations

If you need to add restrictions for particular operations, tables, or columns, you should configure these additional security measures in your data source setup.

**Learn more:** [Connect to database - Table Configuration](../data-sources.md#table-configuration)

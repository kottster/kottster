---
description: "Learn how to use custom SQL queries in Kottster to fetch data for your tables, including pagination and count queries."
---

# Raw SQL queries

For table pages in Kottster, you can define custom SQL queries to fetch data directly from your database. This is useful for complex queries or when you want to optimize performance by fetching only the necessary data.

To set up custom SQL queries, you need to use raw SQL query (`rawSqlQuery`) as a fetch strategy. You can define both the main query to fetch records and an optional count query for pagination.

All of this can be set up using the visual editor or by manually editing the `customSqlQuery` and `customSqlCountQuery` parameters inside [`defineTableController`](./api.md).

## Basic SQL queries

Here are examples of simple SQL queries for different database systems:

::: code-group

```sql [MySQL]
SELECT id, name, email, created_at 
FROM users 
WHERE status = 'active'
ORDER BY created_at DESC
```

```sql [PostgreSQL]
SELECT id, name, email, created_at 
FROM users 
WHERE status = 'active'
ORDER BY created_at DESC
```

```sql [SQLite]
SELECT id, name, email, created_at 
FROM users 
WHERE status = 'active'
ORDER BY created_at DESC
```

```sql [Microsoft SQL Server]
SELECT id, name, email, created_at 
FROM users 
WHERE status = 'active'
ORDER BY created_at DESC
```

:::

## Pagination support

If pagination is being used, your query needs to be modified to use `:limit` and `:offset` parameters:

::: code-group

```sql [MySQL]
SELECT id, name, email, created_at 
FROM users 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset
```

```sql [PostgreSQL]
SELECT id, name, email, created_at 
FROM users 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset
```

```sql [SQLite]
SELECT id, name, email, created_at 
FROM users 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset
```

```sql [Microsoft SQL Server]
SELECT id, name, email, created_at 
FROM users 
WHERE status = 'active'
ORDER BY created_at DESC
OFFSET :offset ROWS 
FETCH NEXT :limit ROWS ONLY
```

:::

### Count queries for pagination

When using pagination, you also need to provide a count query to calculate the total number of records. This is required for proper pagination controls:

::: code-group

```sql [MySQL]
SELECT COUNT(*)
FROM users 
WHERE status = 'active'
```

```sql [PostgreSQL]
SELECT COUNT(*)
FROM users 
WHERE status = 'active'
```

```sql [SQLite]
SELECT COUNT(*)
FROM users 
WHERE status = 'active'
```

```sql [Microsoft SQL Server]
SELECT COUNT(*)
FROM users 
WHERE status = 'active'
```

:::

## Column configuration

When using custom data fetchers, Kottster automatically detects the columns based on the properties of the records returned.
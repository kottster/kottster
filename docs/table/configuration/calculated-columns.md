---
description: "Learn how to define calculated columns in Kottster using SQL queries to display derived data in your tables."
---

# Calculated columns

For table pages in Kottster, you can define custom columns that are calculated by executing a SQL query. This is useful for displaying aggregated data, computed values, or any other derived information that is not directly stored in the database.

## SQL query for calculated columns

Imagine for a table of `users`, you want to add a custom column that will display the full name of the user, which is a combination of first and last names. You can define a calculated column like this:

::: code-group

```sql [MySQL]
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM users
```

```sql [PostgreSQL]
SELECT (first_name || ' ' || last_name) AS full_name FROM users
```

```sql [SQLite]
SELECT (first_name || ' ' || last_name) AS full_name FROM users
```

```sql [Microsoft SQL Server]
SELECT (first_name + ' ' + last_name) AS full_name FROM users
```

:::

The SQL query you provide should return a single value and will be inserted into the SQL query like this:

``` [Example]
SELECT
  id,
  name,
  <your_calculated_column> AS <alias>
FROM users AS main
```

## Using main table alias

If you need to reference the main table in your query, you can use the `main` alias. For example, imagine you have `users` and `orders` tables, and you want to calculate the total purchase amount for each user:

::: code-group

```sql [MySQL]
SELECT SUM(o.amount)
FROM orders o
WHERE o.user_id = main.id
```

```sql [PostgreSQL]
SELECT SUM(o.amount)
FROM orders o
WHERE o.user_id = main.id
```

```sql [SQLite]
SELECT SUM(o.amount)
FROM orders o
WHERE o.user_id = main.id
```

```sql [Microsoft SQL Server]
SELECT SUM(o.amount)
FROM orders o
WHERE o.user_id = main.id
```

:::
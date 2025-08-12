---
description: "Learn how to use custom SQL queries in Kottster dashboard pages to fetch data for stats and charts."
---

# Raw SQL queries

Dashboard pages in Kottster support custom SQL queries to fetch and aggregate data directly from your database for stats and visualizations.

When creating a dashboard page using the visual editor, raw SQL query (`rawSqlQuery`) is set as the default fetch strategy. You can configure queries through the visual editor or by manually editing the `sqlQuery` parameter in [`defineDashboardController`](./api.md).

## Stats

Stats display single numeric values. Your SQL query must return exactly one row with one column containing the metric value.

### Basic queries

Examples of SQL queries for stats:

::: code-group

```sql [MySQL]
SELECT COUNT(*) FROM orders
```

```sql [PostgreSQL]
SELECT COUNT(*) FROM orders
```

```sql [SQLite]
SELECT COUNT(*) FROM orders
```

```sql [Microsoft SQL Server]
SELECT COUNT(*) FROM orders
```

:::

### Date range filtering

When date range filtering is enabled, use `:period_start_date` and `:period_end_date` parameters to filter results dynamically:

::: code-group

```sql [MySQL]
SELECT COUNT(*)
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
```

```sql [PostgreSQL]
SELECT COUNT(*)
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
```

```sql [SQLite]
SELECT COUNT(*)
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
```

```sql [Microsoft SQL Server]
SELECT COUNT(*)
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
```

:::

## Line and area charts

Line and area charts require queries that return multiple rows with:
- **X-axis column**: Typically a date/time column (e.g., `date`, `created_at`)
- **Y-axis column(s)**: Numeric values to plot (supports multiple columns for multi-series charts)

Examples of chart data queries:

::: code-group

```sql [MySQL]
SELECT 
  DATE(created_at) as date, 
  COUNT(*) as order_count,
  SUM(total) as revenue
FROM orders
GROUP BY DATE(created_at) 
ORDER BY date
```

```sql [PostgreSQL]
SELECT 
  DATE(created_at) as date, 
  COUNT(*) as order_count,
  SUM(total) as revenue
FROM orders
GROUP BY DATE(created_at) 
ORDER BY date
```

```sql [SQLite]
SELECT 
  DATE(created_at) as date, 
  COUNT(*) as order_count,
  SUM(total) as revenue
FROM orders
GROUP BY DATE(created_at) 
ORDER BY date
```

```sql [Microsoft SQL Server]
SELECT 
  CAST(created_at AS DATE) as date, 
  COUNT(*) as order_count,
  SUM(total) as revenue
FROM orders
GROUP BY CAST(created_at AS DATE)
ORDER BY date
```

:::

### Date range filtering

When date range filtering is enabled, use `:period_start_date` and `:period_end_date` parameters to filter results dynamically:

::: code-group

```sql [MySQL]
SELECT 
  DATE(created_at) as date, 
  COUNT(*) as order_count,
  SUM(total) as revenue
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
GROUP BY DATE(created_at) 
ORDER BY date
```

```sql [PostgreSQL]
SELECT 
  DATE(created_at) as date, 
  COUNT(*) as order_count,
  SUM(total) as revenue
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
GROUP BY DATE(created_at) 
ORDER BY date
```

```sql [SQLite]
SELECT 
  DATE(created_at) as date, 
  COUNT(*) as order_count,
  SUM(total) as revenue
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
GROUP BY DATE(created_at) 
ORDER BY date
```

```sql [Microsoft SQL Server]
SELECT 
  CAST(created_at AS DATE) as date, 
  COUNT(*) as order_count,
  SUM(total) as revenue
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
GROUP BY CAST(created_at AS DATE)
ORDER BY date
```

:::

## Bar charts

Bar charts require queries that return multiple rows with:
- **X-axis column**: Categorical data (e.g., `status`, `category`, `region`, `product_type`)
- **Y-axis column(s)**: Numeric values to plot (supports multiple columns for grouped bar charts)

Examples of bar chart data queries:

::: code-group

```sql [MySQL]
SELECT 
  status as category,
  COUNT(*) as order_count,
  AVG(total) as avg_order_value
FROM orders
GROUP BY status
ORDER BY order_count DESC
```

```sql [PostgreSQL]
SELECT 
  status as category,
  COUNT(*) as order_count,
  AVG(total) as avg_order_value
FROM orders
GROUP BY status
ORDER BY order_count DESC
```

```sql [SQLite]
SELECT 
  status as category,
  COUNT(*) as order_count,
  AVG(total) as avg_order_value
FROM orders
GROUP BY status
ORDER BY order_count DESC
```

```sql [Microsoft SQL Server]
SELECT 
  status as category,
  COUNT(*) as order_count,
  AVG(total) as avg_order_value
FROM orders
GROUP BY status
ORDER BY order_count DESC
```

:::

### Date range filtering

When date range filtering is enabled, use `:period_start_date` and `:period_end_date` parameters to filter results dynamically:

::: code-group

```sql [MySQL]
SELECT 
  status as category,
  COUNT(*) as order_count,
  SUM(total) as total_revenue
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
GROUP BY status
ORDER BY order_count DESC
```

```sql [PostgreSQL]
SELECT 
  status as category,
  COUNT(*) as order_count,
  SUM(total) as total_revenue
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
GROUP BY status
ORDER BY order_count DESC
```

```sql [SQLite]
SELECT 
  status as category,
  COUNT(*) as order_count,
  SUM(total) as total_revenue
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
GROUP BY status
ORDER BY order_count DESC
```

```sql [Microsoft SQL Server]
SELECT 
  status as category,
  COUNT(*) as order_count,
  SUM(total) as total_revenue
FROM orders 
WHERE 
  created_at >= :period_start_date AND 
  created_at <= :period_end_date
GROUP BY status
ORDER BY order_count DESC
```

:::
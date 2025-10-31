---
description: "Use the useUser hook to get the current authenticated user in Kottster."
---

# useTable hook

The [`useTable`](https://kottster.app/api-reference/functions/_kottster_react.useTable.html) hook is a custom React hook that provides the state and functions to manage a table page or its nested tables.

## Returned values

- **data**: [`TablePageGetRecordsResult`](https://kottster.app/api-reference/interfaces/_kottster_server.TablePageGetRecordsResult.html) - The table data including records and metadata.
- **tableSchema**: [`RelationalDatabaseSchemaTable`](https://kottster.app/api-reference/interfaces/_kottster_react.RelationalDatabaseSchemaTable.html) - The schema of the table.
- **nestedTableKeyAsString**: `string | undefined` - The key of the nested table as a string, if applicable.
- **config**: [`TablePageConfig`](https://kottster.app/api-reference/interfaces/_kottster_react.TablePageConfig.html) - The configuration options for the table page.
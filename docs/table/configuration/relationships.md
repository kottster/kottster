---
description: "Define custom relationships between tables in Kottster. Learn how to set up one-to-one, one-to-many, and many-to-many relationships."
---

<!-- TODO: This page is hidden because it's outdated. Update the content and unhide it later. -->


# Relationships

By default, **Kottster automatically detects relationships between tables based on their foreign keys**. However, you can also define relationships manually if you need to override the default behavior or if your database schema doesn't follow the standard conventions.

To set this up, include the relationship configuration in the `relationships` object inside [`defineTableController`](../../table/introduction.md).

## One-to-one

A one-to-one relationship links one record in a table to exactly one record in another table. To define this relationship in Kottster, provide the following object in `relationships`:

```typescript
{ 
  relation: 'oneToOne',
  
  /** The unique key for the relationship, used to access it in the table configuration */
  key: '',
  
  /** Foreign key column in the current table */   
  foreignKeyColumn: '',
  
  /** The name of the target table */      
  targetTable: '',
  
  /** The primary key column in the target table 
      that the foreign key refers to */ 
  targetTableKeyColumn: ''
}
```

### Example

For example, consider a `users` table with a `workspace_id` column linking to a `workspaces` table. Each user is assigned exactly one workspace.

Imagine we want to create a page to view and manage data in the `users` table. By defining a one-to-one relationship with the `workspaces` table, we can display detailed workspace information instead of just showing `workspace_id`.

This also simplifies forms for creating or updating users. Instead of typing a `workspace_id`, people can select a workspace from a dropdown or list, making the form more intuitive and reducing errors.

**Here's an example of the page files:**

```js [app/pages/users/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

const controller = app.defineTableController({
  ...page.config,
  relationships: [
    {
      relation: 'oneToOne',
      key: 'user_workspace',
      foreignKeyColumn: 'workspace_id',    
      targetTable: 'workspaces',
      targetTableKeyColumn: 'id'
    },
  ],
});

export default controller;
```

As shown above, the page includes a `relationships` object with the key `"user_workspace"`. This key can have any name and is defined for convenience. 

The relation we specified enables two features:

- **Displaying Data**: Adds a Workspace column that shows preview of records from the `workspaces` table instead of just displaying the `workspace_id`.
- **Inserting/Updating Data**: Allows people to select a workspace from a list, improving usability and reducing errors.

## One-to-many

A one-to-many relationship links one record in a table to multiple records in another table. To define this relationship in Kottster, include the following object in `relationships`:

```typescript
{
  relation: 'oneToMany',

  /** The unique key for the relationship, used to access it in the table configuration */
  key: '',
    
  /** The name of the target table */
  targetTable: '',
    
  /** The primary key column in the target table */ 
  targetTableKeyColumn: '',
    
  /** The foreign key column in the target table 
      that refers to the current table */ 
  targetTableForeignKeyColumn: ''
}
```

### Example

For example, consider a `projects` table and a `tasks` table, where each project can have multiple tasks.

Imagine we want to create a page to view data in the `projects` table. By defining a one-to-many relationship, we can display an additional column showing how many tasks are associated with each project and their details.

**Here's how the page files might look:**

```js [app/pages/projects/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

const controller = app.defineTableController({
  ...page.config,
  relationships: [
    {
      relation: 'oneToMany',
      key: 'project_tasks',
      targetTable: 'tasks',
      targetTableKeyColumn: 'id',
      targetTableForeignKeyColumn: 'project_id',
      columns: ['id', 'title', 'status'],
    },
  ],
});

export default controller;
```

## Many-to-many

A many-to-many relationship links multiple records in one table to multiple records in another table. This is implemented using a junction table (also called a join table) to connect the two tables.

To define this relationship in Kottster, include the following object in `relationships`:

```typescript
{
  relation: 'manyToMany';

  /** The unique key for the relationship, used to access it in the table configuration */
  key: '',

  /** Name of the table being referenced/joined */
  targetTable: '',

  /** The primary key column in the target table */
  targetTableKeyColumn: '',
  
  /** Name of the intermediate table that connects the source and target tables */
  junctionTable: '',

  /** Foreign key in the junction table referencing the source table */
  junctionTableSourceKeyColumn: '',

  /** Foreign key in the junction table referencing the target table */
  junctionTableTargetKeyColumn: '',
  
  /** The array of columns in the target table to include 
      in queries and display by default */ 
  columns: [],
}
```

### Example

Consider an `authors` table and a `books` table, where an author can write multiple books, and a book can have multiple authors. To represent this many-to-many relationship, we use a junction table called `author_books`, which links `author_id` in the authors table to `book_id` in the books table.

Imagine we want to create a page to view data in the `books` table. By defining a many-to-many relationship with authors as the target table and `author_books` as the junction table, we can add a column to show how many and which authors are associated with each book.

**Here's how the page files might look:**

```js [app/pages/books/api.server.js]
import { app } from '../../_server/app';
import page from './page.json';

const controller = app.defineTableController({
  ...page.config,
  relationships: [
    {
      relation: 'manyToMany',
      key: 'book_authors',

      // Junction table details
      junctionTable: 'author_books',
      junctionTableSourceKeyColumn: 'book_id',
      junctionTableTargetKeyColumn: 'author_id',

      // Target table details
      targetTable: 'authors',
      targetTableKeyColumn: 'id',
      columns: ['id', 'full_name'],
    },
  ],
});

export default controller;
```


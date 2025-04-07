---
sidebar_position: 4
---

# Linked records (Joins)

Kottster allows you to fetch data from related tables when displaying data in a table or in a form for creating or updating records. To set this up, include the relationship configuration in the `linked` object inside [`defineTableController`](/table/configuration/api).

## One-to-one

A one-to-one relationship links one record in a table to exactly one record in another table. To define this relationship in Kottster, provide the following object in `linked`:

```typescript
{
    relation: 'oneToOne',
    
    /** Foreign key column in the current table */   
    foreignKeyColumn: '',
    
    /** The name of the target table */      
    targetTable: '',
    
    /** The primary key column in the target table 
        that the foreign key refers to */ 
    targetTableKeyColumn: '',
    
    /** The array of columns in the target table to include 
        in queries and display by default */
    columns: [],
    
    /** The array of columns in the target table available for search */
    searchableColumns: [],
}
```

### Example

For example, consider a `users` table with a `workspace_id` column linking to a `workspaces` table. Each user is assigned exactly one workspace.

Imagine we want to create a page to view and manage data in the `users` table. By defining a one-to-one relationship with the `workspaces` table, we can display detailed workspace information instead of just showing `workspace_id`.

This also simplifies forms for creating or updating users. Instead of typing a `workspace_id`, people can select a workspace from a dropdown or list, making the form more intuitive and reducing errors.

**Here’s an example of the page file:**

```typescript
import { OneToOneRelation } from '@kottster/server';
import { TablePage } from '@kottster/react';
import { app } from '../.server/app';
import dataSource from '../.server/data-sources/postgres';

export const action = app.defineTableController(dataSource, {
  rootTable: {
    table: 'users',
    primaryKeyColumn: 'id',
    pageSize: 30,
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    linked: {
      user_workspace: new OneToOneRelation({
        foreignKeyColumn: 'workspace_id',    
        targetTable: 'workspaces',
        targetTableKeyColumn: 'id',
        columns: ['id', 'name'],
        searchableColumns: ['name'],
      }),
    },
  },
});

export default () => (
  <TablePage
    columns={[
      {
        label: 'User ID',
        column: 'id',
      },
      {
        label: 'Name',
        column: 'first_name',
      },
      {
        label: 'Email',
        column: 'email',
      },
      {
        label: 'Workspace',
        column: 'workspace',
        linked: 'user_workspace',
      },
    ]}
  />
);
```

As shown above, the page includes a `linked` object with a relation under the key user_workspace. This key can have any name and is defined for convenience. It is also referenced in the **Workspace** column.

The relation we specified enables two features:

- **Displaying Data**: Adds a Workspace column that shows the workspace ID and name from the `workspaces` table.

- **Inserting/Updating Data**: Allows people to select a workspace from a list, improving usability and reducing errors.

## One-to-many

A one-to-many relationship links one record in a table to multiple records in another table. To define this relationship in Kottster, include the following object in `linked`:

```typescript
{
  relation: 'oneToMany',
    
  /** The name of the target table */
  targetTable: '',
    
  /** The primary key column in the target table */ 
  targetTableKeyColumn: '',
    
  /** The foreign key column in the target table 
      that refers to the current table */ 
  targetTableForeignKeyColumn: '',
    
  /** The array of columns in the target table to include 
      in queries and display by default */ 
  columns: [],
    
  /** The array of columns in the target table available for search */ 
  searchableColumns: [],
}
```

### Example

For example, consider a `projects` table and a `tasks` table, where each project can have multiple tasks.

Imagine we want to create a page to view data in the `projects` table. By defining a one-to-many relationship, we can display an additional column showing how many tasks are associated with each project and their details.

**Here’s how the page file might look:**

```typescript
import { OneToManyRelation } from '@kottster/server';
import { TablePage } from '@kottster/react';
import { app } from '../.server/app';
import dataSource from '../.server/data-sources/postgres';

export const action = app.defineTableController(dataSource, {
  rootTable: {
    table: 'projects',
    primaryKeyColumn: 'id',
    pageSize: 30,
    linked: {
      project_tasks: new OneToManyRelation({
        targetTable: 'tasks',
        targetTableKeyColumn: 'id',
        targetTableForeignKeyColumn: 'project_id',
        columns: ['id', 'title', 'status'],
        searchableColumns: ['title', 'status'],
      }),
    },
  },
});

export default () => (
  <TablePage
    columns={[
      {
        label: 'Project Name',
        column: 'name',
      },
      {
        label: 'Tasks',
        column: 'tasks',
        linked: 'project_tasks',
      },
    ]}
  />
);
```

## Many-to-many

A many-to-many relationship links multiple records in one table to multiple records in another table. This is implemented using a junction table (also called a join table) to connect the two tables.

To define this relationship in Kottster, include the following object in `linked`:

```typescript
{
  /** Specifies the type of relationship between tables */
  relation: 'manyToMany';

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
  
  /** The array of columns in the target table available for search */ 
  searchableColumns: []
}
```

### Example

Consider an `authors` table and a `books` table, where an author can write multiple books, and a book can have multiple authors. To represent this many-to-many relationship, we use a junction table called `author_books`, which links `author_id` in the authors table to `book_id` in the books table.

Imagine we want to create a page to view data in the `books` table. By defining a many-to-many relationship with authors as the target table and `author_books` as the junction table, we can add a column to show how many and which authors are associated with each book.

**Here’s how the page file might look:**

```typescript
import { ManyToManyRelation } from '@kottster/server';
import { TablePage } from '@kottster/react';
import { app } from '../.server/app';
import dataSource from '../.server/data-sources/postgres';

export const action = app.defineTableController(dataSource, {
  rootTable: {
    table: 'books',
    primaryKeyColumn: 'id',
    pageSize: 30,
    linked: {
      book_authors: new ManyToManyRelation({
        // Junction table details
        junctionTable: 'author_books',
        junctionTableSourceKeyColumn: 'book_id',
        junctionTableTargetKeyColumn: 'author_id',

        // Target table details
        targetTable: 'authors',
        targetTableKeyColumn: 'id',
        columns: ['id', 'full_name'],
        searchableColumns: ['full_name'],
      }),
    },
  },
});

export default () => (
  <TablePage
    columns={[
      { 
        label: 'Book Title', 
        column: 'title' 
      },
      { 
        label: 'Authors', 
        column: 'authors', 
        linked: 'book_authors' 
      },
    ]}
  />
);
```

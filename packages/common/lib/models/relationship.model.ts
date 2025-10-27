import { TablePageConfig } from "./tablePage.model";

interface RelationshipBase {
  key: string;
}

export type Relationship = OneToOneRelationship | OneToManyRelationship;

export interface OneToOneRelationship extends RelationshipBase {
  relation?: 'oneToOne';

  /** The name of the column in the current table that references the target table's primary key */
  foreignKeyColumn?: string;
  
  /** Name of the table being referenced/joined */
  targetTable?: string;
  
  /** The foreign key column in the current table that references the target table's primary key */
  targetTableKeyColumn?: string;

  /** Optional object to specify linked tables of the target table */
  relationships?: TablePageConfig['relationships'];
}

export interface OneToManyRelationship extends RelationshipBase {  
  relation?: 'oneToMany';

  /** Name of the table being referenced/joined */
  targetTable?: string;
  
  /** The primary key column in the target table */
  targetTableKeyColumn?: string;

  /** The foreign key column in the target table that references the current table's primary key */
  targetTableForeignKeyColumn?: string;

  /** Optional object to specify linked tables of the target table */
  relationships?: TablePageConfig['relationships'];
}
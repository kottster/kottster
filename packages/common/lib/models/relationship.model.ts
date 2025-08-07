import { TablePageConfig } from "./tablePage.model";

interface RelationshipBase {
  key: string;

  position?: number;

  hiddenInTable?: boolean;

  /** Display name for the relation */
  label?: string;
}

export type Relationship = OneToOneRelationship | OneToManyRelationship | ManyToManyRelationship;

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

export interface ManyToManyRelationship extends RelationshipBase {
  relation: 'manyToMany';

  /** Name of the table being referenced/joined */
  targetTable?: string;
  
  /** The primary key column in the target table */
  targetTableKeyColumn?: string;

  /** Name of the junction/pivot table */
  junctionTable?: string;

  /** The foreign key column in the junction table that references the current table */
  junctionTableSourceKeyColumn?: string;

  /** The foreign key column in the junction table that references the target table */
  junctionTableTargetKeyColumn?: string;

  /** Optional object to specify linked tables of the target table */
  relationships?: TablePageConfig['relationships'];
}
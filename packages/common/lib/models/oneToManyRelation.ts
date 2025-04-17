import { TablePageConfig } from "./tablePage.model";

export interface OneToManyRelationConfig {
  key: string;

  position?: number;

  hidden?: boolean;
  
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
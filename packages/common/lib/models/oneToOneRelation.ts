import { TablePageConfig } from "./tablePage.model";

export interface OneToOneRelationConfig {
  key: string;
  
  position?: number;

  hidden?: boolean;

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
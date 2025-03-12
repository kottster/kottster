import { TableRpc } from "./tableRpc.model";

export interface OneToOneRelationConfig {
  relation: 'oneToOne';

  /** The name of the column in the current table that references the target table's primary key */
  foreignKeyColumn: string;
  
  /** Name of the table being referenced/joined */
  targetTable: string;
  
  /** The foreign key column in the current table that references the target table's primary key */
  targetTableKeyColumn: string;
  
  /** Array of column names to display in the preview view (e.g. table cells, dropdowns) */
  previewColumns: string[];

  /** Optional object to specify linked tables of the target table */
  linked?: TableRpc['linked'];
}
import { TableRpc, TableRpcSelect } from "./tableRpc.model";

export interface OneToManyRelationConfig {
  relation: 'oneToMany';

  /** Name of the table being referenced/joined */
  targetTable: string;
  
  /** The primary key column in the target table */
  targetTableKeyColumn: string;

  /** The foreign key column in the target table that references the current table's primary key */
  targetTableForeignKeyColumn: string;

  /** Array of column names to display in the preview view (e.g. table cells, dropdowns) */
  previewColumns: string[];
  
  /** Optional array of column names to select from the target table. 
   * If not provided, all columns will be selected */
  columns?: TableRpcSelect['columns'];
  
  /** Optional array of column names from the target table that can be used for searching */
  searchableColumns?: TableRpcSelect['searchableColumns'];

  /** Optional array of column names from the target table that can be used for sorting */
  sortableColumns?: TableRpcSelect['sortableColumns'];

  /** Optional array of column names from the target table that can be used for filtering */
  filterableColumns?: TableRpcSelect['filterableColumns'];

  /** Optional object to specify linked tables of the target table */
  linked?: TableRpc['linked'];
}
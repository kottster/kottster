import { TableRpc } from "./tableRpc.model";

export interface OneToManyRelationConfig {
  relation: 'oneToMany';

  /** Name of the table being referenced/joined */
  targetTable: string;
  
  /** The primary key column in the target table */
  targetTableKeyColumn: string;

  /** The foreign key column in the target table that references the current table's primary key */
  targetTableForeignKeyColumn: string;

  /** Optional object to specify linked tables of the target table */
  linked?: TableRpc['linked'];
}
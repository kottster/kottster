import { TableRpc } from "./tableRpc.model";

export interface ManyToManyRelationConfig {
  relation: 'manyToMany';

  /** Name of the table being referenced/joined */
  targetTable: string;
  
  /** The primary key column in the target table */
  targetTableKeyColumn: string;

  /** Name of the junction/pivot table */
  junctionTable: string;

  /** The foreign key column in the junction table that references the current table */
  junctionTableSourceKeyColumn: string;

  /** The foreign key column in the junction table that references the target table */
  junctionTableTargetKeyColumn: string;

  /** Optional object to specify linked tables of the target table */
  linked?: TableRpc['linked'];
}
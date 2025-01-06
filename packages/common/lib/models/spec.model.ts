import { RelationalDatabaseSchemaTable } from "./databaseSchema.model";
import { StatRpc } from "./statRpc.model";
import { TableRpc } from "./tableRpc.model";

export interface TableSpec {
  tableRpc: TableRpc;
  tableSchema?: RelationalDatabaseSchemaTable;
}

export interface StatSpec {
  statRpc: StatRpc;
}
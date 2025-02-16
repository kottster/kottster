import { RelationalDatabaseSchemaTable } from "./databaseSchema.model";
import { TableRpc } from "./tableRpc.model";

export interface TableSpec {
  tableRpc: TableRpc;
  tableSchema?: RelationalDatabaseSchemaTable;
  linkedTableSchemas?: RelationalDatabaseSchemaTable[];
}
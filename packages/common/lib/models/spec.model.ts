import { RelationalDatabaseSchema } from "./databaseSchema.model";
import { StatRpc } from "./statRpc.model";
import { TableRpc } from "./tableRpc.model";

export interface TableSpec {
  tableRpc: TableRpc;
  tableSchema: RelationalDatabaseSchema['tables'][number];
}

export interface StatSpec {
  statRpc: StatRpc;
}
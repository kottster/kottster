import { RelationalDatabaseSchema } from "./databaseSchema.model";
import { StatRPC } from "./statRpc.model";
import { TableRPC } from "./tableRpc.model";

export interface TableSpec {
  tableRPC: TableRPC;
  tableSchema: RelationalDatabaseSchema['tables'][number];
}

export interface StatSpec {
  statRPC: StatRPC;
}
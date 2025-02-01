import { RelationalDatabaseSchemaTable } from "./databaseSchema.model";
import { ManyToManyRelationConfig } from "./manyToManyRelation";
import { OneToManyRelationConfig } from "./oneToManyRelation";
import { OneToOneRelationConfig } from "./oneToOneRelation";

export interface TableRpcInputBase {}

export interface TableRpcInputSpec extends TableRpcInputBase {}

export enum TableRpcInputSelectOperator {
  equal = 'equal',
  notEqual = 'not equal',
}

export interface TableRpcInputSelect extends TableRpcInputBase {
  page: number;
  search?: string;
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  filters?: {
    column: string;
    operator: keyof typeof TableRpcInputSelectOperator;
    value: any;
  }[];

  tableSchema: RelationalDatabaseSchemaTable;
}

export interface TableRpcInputSelectUsingExecuteQuery extends TableRpcInputBase {
  page?: number;
  search?: string;
}

export interface TableRpcInputSelectLinkedRecords extends TableRpcInputBase {
  linkedItemKey: string;
  
  page: number;
  search?: string;
  
  // For selecting particular records
  primaryKeyValues?: (string | number)[];

  // For selecting linked records
  foreignKeyValues?: (string | number)[];
}

export interface TableRpcInputInsert extends TableRpcInputBase {
  values: Record<string, any>;

  tableSchema: RelationalDatabaseSchemaTable;
}

export interface TableRpcInputUpdate extends TableRpcInputBase {
  primaryKeys: (string | number)[];
  values: Record<string, any>;

  tableSchema: RelationalDatabaseSchemaTable;
}

export interface TableRpcInputDelete extends TableRpcInputBase {
  primaryKeys: any[];
}

export interface TableRpcSelect {
  pageSize?: number;
  columns?: string[];
  excludeColumns?: string[];
  sortableColumns?: string[];
  searchableColumns?: string[];
  filterableColumns?: string[];
  columnsOrder?: string[];
  where?: {
    column: string;
    operator: '=' | '>' | '>=' | '<' | '<=' | '<>';
    value: any;
  }[];
  orderBy?: {
    column: string;
    direction: 'asc' | 'desc';
  }[];
  executeQuery?: (input: TableRpcInputSelectUsingExecuteQuery) => Promise<TableRpcResultSelectDTO>;
}

export interface TableRpcInsert {
  columns?: string[];
  excludeColumns?: string[];
  beforeInsert?: (record: Record<string, any>) => Record<string, any>;
  // getDefaultValues?: (record: Record<string, any>) => Record<string, any>;
  canBeInserted?: (record: Record<string, any>) => boolean;
}

export interface TableRpcUpdate extends Omit<TableRpcInsert, 'canBeInserted' | 'beforeInsert'> {
  canBeUpdated?: (record: Record<string, any>) => boolean;
  beforeUpdate?: (record: Record<string, any>) => Record<string, any>;
}

export interface TableRpcDelete {
  canBeDeleted?: (record: Record<string, any>) => boolean;
}

export interface TableRpc {
  primaryKeyColumn?: string;
  table?: string;
  select: TableRpcSelect;
  insert?: TableRpcInsert;
  update?: TableRpcUpdate;
  delete?: TableRpcDelete;

  /** Optional object to specify linked tables */
  linked?: Record<string, OneToOneRelationConfig | OneToManyRelationConfig | ManyToManyRelationConfig>;
}

// Public version of TableRpc, available for developers to use
export interface TableRpcSimplified extends Omit<TableRpc, 'insert' | 'update' | 'delete'> {
  insert?: boolean | TableRpc['insert'];
  update?: boolean | TableRpc['update'];
  delete?: boolean | TableRpc['delete'];
}

export type TableRpcResultSelectRecord = Record<string, any>;

export type TableRpcResultSelectRecordLinkedDTO = Record<string, {
  records?: TableRpcResultSelectRecord[];
  totalRecords?: number;
}>;

export interface TableRpcResultSelectDTO {
  records?: TableRpcResultSelectRecord[];
  totalRecords?: number;
}

export interface TableRpcResultSelectLinkedRecordsDTO {
  records?: TableRpcResultSelectRecord[];
  totalRecords?: number;
}

export interface TableRpcResultInsertDTO {}

export interface TableRpcResultUpdateDTO {}
import { FormField } from "./formField.model";
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
  tableRpc: TableRpc;

  page: number;
  pageSize: number;
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
  
  // TODO: Add many-to-many relation support
  getByForeignRecord?: {
    linkedItem: LinkedItem & { relation: 'oneToMany' };
    recordPrimaryKeyValue: string | number;
  };
}

export interface TableRpcInputSelectUsingExecuteQuery extends TableRpcInputBase {
  page?: number;
  search?: string;
}

export interface TableRpcInputSelectSingle extends TableRpcInputBase {
  tableRpc: TableRpc;

  /** If selecting records from linked table */
  linkedItemKey?: string;

  /** For selecting particular records */
  primaryKeyValues?: (string | number)[];

  forPreview?: boolean;
}

export interface TableRpcInputInsert extends TableRpcInputBase {
  tableRpc: TableRpc;

  values: Record<string, any>;
}

export interface TableRpcInputUpdate extends TableRpcInputBase {
  tableRpc: TableRpc;

  primaryKeys: (string | number)[];
  values: Record<string, any>;
}

export interface TableRpcInputDelete extends TableRpcInputBase {
  tableRpc: TableRpc;
  primaryKeys: any[];
}

export type LinkedItem = OneToOneRelationConfig | OneToManyRelationConfig | ManyToManyRelationConfig;

export enum TableRpcFormColumnRequirementRule {
  none = 'none',
  notEmpty = 'notEmpty',
  notZero = 'notZero',
}

export interface TableRpc {
  table?: string;
  primaryKeyColumn?: string;
  pageSize?: number;

  columns?: string[];
  columnsOrder?: string[];
  hiddenColumns?: string[];
  sortableColumns?: string[];
  searchableColumns?: string[];
  filterableColumns?: string[];
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

  hiddenLinkedItems?: string[];
  linkedItemsOrder?: string[];

  allowInsert?: boolean;
  beforeInsert?: (record: Record<string, any>) => Record<string, any>;
  canBeInserted?: (record: Record<string, any>) => boolean;

  allowUpdate?: boolean;
  beforeUpdate?: (record: Record<string, any>) => Record<string, any>;
  canBeUpdated?: (record: Record<string, any>) => boolean;

  allowDelete?: boolean;
  canBeDeleted?: (record: Record<string, any>) => boolean;

  formHiddenColumns?: string[];
  formColumnsOrder?: string[];

  formColumnsFormFields?: {
    column: string;
    type?: FormField['type'];
  }[];

  formColumnsRequirements?: {
    column: string;
    rule: keyof typeof TableRpcFormColumnRequirementRule;
  }[];

  linkedItemPreviewColumns?: Record<string, string[]>;

  /** Optional object to specify linked tables */
  linked?: Record<string, LinkedItem>;
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

export interface TableRpcResultSelectSingleDTO {
  record: TableRpcResultSelectRecord;
}

export interface TableRpcResultInsertDTO {}

export interface TableRpcResultUpdateDTO {}

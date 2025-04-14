import { FilterItem } from "./filter.model";
import { FormField } from "./formField.model";
import { ManyToManyRelationConfig } from "./manyToManyRelation";
import { OneToManyRelationConfig } from "./oneToManyRelation";
import { OneToOneRelationConfig } from "./oneToOneRelation";

export interface TablePageInputBase {}

export interface TablePageInputSelect extends TablePageInputBase {
  // Specify table page config only if this is not a root table
  tablePageConfig?: TablePageConfig;

  page: number;
  pageSize: number;
  search?: string;
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  filters?: FilterItem[];
  
  // TODO: Add many-to-many relation support
  getByForeignRecord?: {
    relationship: Relationship & { relation: 'oneToMany' };
    recordPrimaryKeyValue: string | number;
  };
}

export interface TablePageInputSelectUsingExecuteQuery extends TablePageInputBase {
  page?: number;
  search?: string;
}

export interface TablePageInputSelectSingle extends TablePageInputBase {
  tablePageConfig: TablePageConfig;

  /** If selecting records from linked table */
  relationshipKey?: string;

  /** For selecting particular records */
  primaryKeyValues?: (string | number)[];

  forPreview?: boolean;
}

export interface TablePageInputInsert extends TablePageInputBase {
  tablePageConfig: TablePageConfig;

  values: Record<string, any>;
}

export interface TablePageInputUpdate extends TablePageInputBase {
  tablePageConfig: TablePageConfig;

  primaryKeys: (string | number)[];
  values: Record<string, any>;
}

export interface TablePageInputDelete extends TablePageInputBase {
  tablePageConfig: TablePageConfig;
  primaryKeys: any[];
}

export type Relationship = OneToOneRelationConfig | OneToManyRelationConfig | ManyToManyRelationConfig;

export enum TablePageFormColumnRequirementRule {
  none = 'none',
  notEmpty = 'notEmpty',
  notZero = 'notZero',
}

export interface TablePageConfigColumn {
  column: string;

  label?: string;
  prefix?: string;
  suffix?: string;
  
  hidden?: boolean;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  
  formField?: FormField;
  formFieldRequirement?: keyof typeof TablePageFormColumnRequirementRule;
  formFieldSpan?: string;
  
  relationshipPreviewColumns?: string[];
  
  /** Client-side index of the column in the table */
  position?: number;

  /** Client-side custom render function for the column */
  render?: (row: TablePageResultSelectRecord) => any;

  /** Client-side custom width for the column */
  width?: number;
}

export interface TablePageConfig {
  table?: string;
  primaryKeyColumn?: string;
  pageSize?: number;
  columns?: TablePageConfigColumn[];

  executeQuery?: (input: TablePageInputSelectUsingExecuteQuery) => Promise<TablePageResultSelectDTO>;

  allowInsert?: boolean;
  beforeInsert?: (record: Record<string, any>) => Record<string, any>;
  canBeInserted?: (record: Record<string, any>) => boolean;

  allowUpdate?: boolean;
  beforeUpdate?: (record: Record<string, any>) => Record<string, any>;
  canBeUpdated?: (record: Record<string, any>) => boolean;

  allowDelete?: boolean;
  canBeDeleted?: (record: Record<string, any>) => boolean;

  /** Optional object to specify relationships */
  relationships?: Relationship[];
}

export type TablePageResultSelectRecord = Record<string, any>;

export type TablePageResultSelectRecordLinkedDTO = Record<string, {
  records?: TablePageResultSelectRecord[];
  totalRecords?: number;
}>;

export interface TablePageResultSelectDTO {
  records?: TablePageResultSelectRecord[];
  totalRecords?: number;
}

export interface TablePageResultSelectSingleDTO {
  record: TablePageResultSelectRecord;
}

export interface TablePageResultInsertDTO {}

export interface TablePageResultUpdateDTO {}

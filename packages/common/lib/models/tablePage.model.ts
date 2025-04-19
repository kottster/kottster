import { FilterItem } from "./filter.model";
import { FieldInput } from "./fieldInput.model";
import { OneToManyRelationship, Relationship } from "./relationship.model";

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
    relationship: OneToManyRelationship;
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

export enum TablePageFieldRequirement {
  none = 'none',
  notEmpty = 'notEmpty',
  notZero = 'notZero',
}

export interface TablePageConfigColumn {
  /** Column name in the database table or any other unique identifier */
  column: string;

  /** Display name for the column */
  label?: string;

  /** Prefix for the column value (goes before the value) */
  prefix?: string;

  /** Suffix for the column value (goes after the value) */
  suffix?: string;
  
  /** 
   * Whether the column is hidden in the table 
   * @default false
   */
  hiddenInTable?: boolean;

  /** Whether the column is sortable */
  sortable?: boolean;

  /** Whether the column is searchable */
  searchable?: boolean;

  /** Whether the column is filterable */
  filterable?: boolean;
  
  /** 
   * Whether the column is hidden in the form
   * @default false
   */
  hiddenInForm?: boolean;

  /**
   * Form input type and its properties
   */
  fieldInput?: FieldInput;

  /** 
   * Validation rule for the column
   */
  fieldRequirement?: string | keyof typeof TablePageFieldRequirement;

  /** Grid field span for the field in the form (12, 8, 6, 4) */
  formFieldSpan?: string;
  
  /** If the column is a foreign key, this specifies the column in the related table to be displayed as the label */
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

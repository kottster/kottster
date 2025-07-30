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
  page: number;
  pageSize: number;
  search?: string;
}

export interface TablePageInputSelectSingle extends TablePageInputBase {
  tablePageConfig?: TablePageConfig;

  /** If selecting records from linked table */
  relationshipKey?: string;

  /** For selecting particular records */
  primaryKeyValues?: (string | number)[];

  forPreview?: boolean;
}

export interface TablePageInputInsert extends TablePageInputBase {
  tablePageConfig?: TablePageConfig;
  values: Record<string, any>;
}

export interface TablePageInputUpdate extends TablePageInputBase {
  tablePageConfig?: TablePageConfig;
  primaryKey: any;
  values: Record<string, any>;
}

export interface TablePageInputDelete extends TablePageInputBase {
  tablePageConfig?: TablePageConfig;
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

  /** 
   * Client-side custom render function for the column 
   * 
   * @param record - The record object containing all columns
   * @param recordIndex - The index of the record in the current page
   * @param data - Additional data including all records and total count
   * 
   * @example render: (record) => <span>{record.first_name} {record.last_name}</span>
   * 
   * @returns The rendered React element or content for the column
   */
  render?: (
    record: TablePageResultSelectRecord,
    recordIndex: number, 
    data: {
      records: TablePageResultSelectRecord[];
      total: number;
    }
  ) => any;

  /** Client-side custom width for the column */
  width?: number;
}

export interface TablePageConfigCalculatedColumn {
  /** Display name for the column */
  label?: string;

  /** Client-side index of the column in the table */
  position?: number;

  /**
   * Raw SQL expression for the calculated column
   * Use 'main' as the alias for the main table
   * @example 'SELECT COUNT(*) FROM orders WHERE orders.user_id = main.id'
   */
  sqlExpression: string;

  /**
   * Alias for the calculated column in SQL results and display
   * This will be used as both the SQL alias and the property name in result objects
   */
  alias: string;
}

export enum TableFetchStrategy {
  databaseTable = 'databaseTable',
  rawSqlQuery = 'rawSqlQuery',
  customFetch = 'customFetch',
}

export interface TablePageConfig {
  /** 
   * Set up using no-code 
   */

  table?: string;
  dataSource?: string;
  fetchStrategy: keyof typeof TableFetchStrategy;

  primaryKeyColumn?: string;
  pageSize?: number;
  
  columns?: TablePageConfigColumn[];
  calculatedColumns?: TablePageConfigCalculatedColumn[];

  allowInsert?: boolean;
  allowUpdate?: boolean;
  allowDelete?: boolean;

  allowedRoleIdsToInsert?: string[];
  allowedRoleIdsToUpdate?: string[];
  allowedRoleIdsToDelete?: string[];

  customSqlQuery?: string;
  customSqlCountQuery?: string;

  /** 
   * Set up using manual configuration
   */

  /**
   * Custom fetcher function to retrieve data.
   * The function should return records and total count
   * @param input - The input parameters for fetching data (page, search, etc.)
   * @returns An object containing records and total
   */
  customDataFetcher?: (input: TablePageInputSelectUsingExecuteQuery) => Promise<TablePageResultSelectDTO>;

  /**
   * Function to check if a record can be inserted.
   * This can be used to perform custom validations before insertion
   * @param values - The values of the record to be inserted
   * @returns A boolean indicating whether the record can be inserted
   */
  validateRecordBeforeInsert?: (values: Record<string, any>) => boolean | Promise<boolean>;

  /**
   * Function to modify the record before inserting it.
   * @param values - The values of the record to be inserted
   * @returns The modified record to be inserted
   */
  transformRecordBeforeInsert?: (values: Record<string, any>) => Record<string, any> | Promise<Record<string, any>>;

  /**
   * Function to execute after a record is inserted.
   * This can be used to perform custom actions after insertion
   * @param primaryKey - The primary key of the record that was inserted
   * @param values - The values of the record that was inserted
   */
  afterInsert?: (primaryKey: any, values: Record<string, any>) => void | Promise<void>;

  /**
   * Function to modify the record before updating it.
   * @param primaryKey - The primary key of the record to be updated
   * @param values - The values of the record to be updated
   * @returns A boolean indicating whether the record can be updated
   */
  validateRecordBeforeUpdate?: (primaryKey: any, values: Record<string, any>) => boolean | Promise<boolean>;

  /**
   * Function to modify the record before updating it.
   * @param primaryKey - The primary key of the record to be updated
   * @param values - The values of the record to be updated
   * @returns The modified record to be updated
   */
  transformRecordBeforeUpdate?: (primaryKey: any, values: Record<string, any>) => Record<string, any> | Promise<Record<string, any>>;

  /**
   * Function to execute after a record is updated.
   * This can be used to perform custom actions after update
   * @param primaryKeyColumn - The primary key column of the record
   * @param values - The values of the record that was updated
   */
  afterUpdate?: (primaryKey: any, values: Record<string, any>) => void | Promise<void>;

  /**
   * Function to execute before deleting a record.
   * This can be used to perform custom actions before deletion
   * @param primaryKey - The primary key of the record to be deleted
   * @returns A boolean indicating whether the record can be deleted
   */
  validateRecordBeforeDelete?: (primaryKey: any) => boolean | Promise<boolean>;

  /**
   * Function to execute after a record is deleted.
   * This can be used to perform custom actions after deletion
   * @param primaryKey - The primary key of the record that was deleted
   */
  afterDelete?: (primaryKey: any) => void | Promise<void>;

  /** 
   * Column name to sort by default
   */
  defaultSortColumn?: string;

  /**
   * Default sort direction
   * @default 'desc'
   */
  defaultSortDirection?: 'asc' | 'desc';

  /*
   * Optional object to specify relationships
   */
  relationships?: Relationship[];

  /*
   * Knex query modifier (type Knex.Where)
   */
  knexQueryModifier?: any;

  /** 
   * Nested configurations
   */
  nested?: {
    [key: string]: TablePageConfig;
  };
}

export type TablePageResultSelectRecord = Record<string, any>;

export type TablePageResultSelectRecordLinkedDTO = Record<string, {
  records?: TablePageResultSelectRecord[];
  total?: number;
}>;

export interface TablePageResultSelectDTO {
  records?: TablePageResultSelectRecord[];
  total?: number;
}

export interface TablePageResultSelectSingleDTO {
  record: TablePageResultSelectRecord;
}

export interface TablePageResultInsertDTO {}

export interface TablePageResultUpdateDTO {}

import { FilterItem } from "./filter.model";
import { OneToManyRelationship } from "./relationship.model";
import { TablePageNestedTableKey, TablePageRecord } from "./tablePage.model";

export interface TablePageInputBase {}

export interface TablePageGetRecordsInput extends TablePageInputBase {
  // Specify table page config only if this is not a root table
  nestedTableKey?: TablePageNestedTableKey;

  page: number;
  pageSize: number;
  search?: string;
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  filters?: FilterItem[];
  
  viewKey?: string;

  getByForeignRecord?: {
    relationship: OneToManyRelationship;
    recordPrimaryKeyValue: string | number;
  };
}

export interface TablePageInitiateRecordsExportInput extends TablePageGetRecordsInput {
  format: 'csv' | 'json' | 'xlsx';
}

export interface TablePageCustomDataFetcherInput extends TablePageInputBase {
  page: number;
  pageSize: number;
  search?: string;
}

export interface TablePageGetRecordInput extends TablePageInputBase {
  nestedTableKey?: TablePageNestedTableKey;

  /** For selecting particular records */
  primaryKeyValues?: any[];

  forPreview?: boolean;
}

export interface TablePageCreateRecordInput extends TablePageInputBase {
  nestedTableKey?: TablePageNestedTableKey;
  values: Record<string, any>;
}

export interface TablePageUpdateRecordInput extends TablePageInputBase {
  nestedTableKey?: TablePageNestedTableKey;
  primaryKeyValue: any;
  values: Record<string, any>;
}

export interface TablePageDeleteRecordInput extends TablePageInputBase {
  nestedTableKey?: TablePageNestedTableKey;
  primaryKeyValues: any[];
}

export interface TablePageGetRecordsResult {
  records?: TablePageRecord[];
  total?: number;
}

export interface TablePageGetRecordResult {
  record: TablePageRecord;
}

export interface TablePageInitiateRecordsExportResult {
  operationId: string;
}

export interface TablePageCreateRecordResult {}

export interface TablePageUpdateRecordResult {}
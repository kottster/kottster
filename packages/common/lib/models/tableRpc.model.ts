import { RelationalDatabaseSchemaTable } from "./databaseSchema.model";

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

export interface TableRpcInputSelectLinkedRecords extends TableRpcInputBase {
  linkedItemIndex: number;
  
  page: number;
  search?: string;
  
  // For selecting particular records
  primaryKeyValues?: (string | number)[];
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

export interface TableRpcLinkedTableOneToOne {
  /** Specifies the type of relationship between tables */
  relation: 'oneToOne';

  /** The name of the column in the current table that references the target table's primary key */
  foreignKeyColumn: string;
  
  /** Name of the table being referenced/joined */
  targetTable: string;
  
  /** The foreign key column in the current table that references the target table's primary key */
  targetTableKeyColumn: string;
  
  /** Optional array of column names to select from the target table. 
   * If not provided, all columns will be selected */
  columns?: string[];
  
  /** Optional array of column names from the target table that can be used for searching */
  searchableColumns?: string[];
}

export interface TableRpcLinkedTableOneToMany {
  /** Specifies the type of relationship between tables */
  relation: 'oneToMany';
  
  /** Name of the table being referenced/joined */
  targetTable: string;

  /** The primary key column in the target table */
  targetTableKeyColumn: string;
  
  /** The foreign key column in the foreign table that references the target table's primary key */
  targetTableForeignKeyColumn: string;
  
  /** Optional array of column names to select from the target table. 
   * If not provided, all columns will be selected */
  columns?: string[];
  
  /** Optional array of column names from the target table that can be used for filtering/searching */
  searchableColumns?: string[];

  /** Optional number of records to select from the target table when joining */
  previewMaxRecords: number;
}

// TODO: will be implemented later
// export interface TableRpcSelectLinkedTableManyToMany {
//   /** Specifies the type of relationship between tables */
//   relation: 'manyToMany';
  
//   /** Name of the intermediate table that connects the source and target tables */
//   junctionTableName: string;
  
//   /** The column in the junction table that references the source table's primary key */
//   sourceColumnInJunction: string;
  
//   /** The column in the junction table that references the target table's primary key */
//   targetColumnInJunction: string;
  
//   /** Name of the target table being referenced through the junction table */
//   targetTable: string;
  
//   /** Optional array of column names to select from the target table. 
//    * If not provided, all columns will be selected */
//   columns?: string[];
  
//   /** Optional array of column names from the target table that can be used for filtering/searching */
//   searchableColumns?: string[];
// }

export type TableRpcLinkedTable = TableRpcLinkedTableOneToOne | TableRpcLinkedTableOneToMany;

export interface TableRpcSelect {
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
  pageSize: number;
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
  primaryKeyColumn: string;
  table: string;
  select: TableRpcSelect;
  insert?: TableRpcInsert;
  update?: TableRpcUpdate;
  delete?: TableRpcDelete;
  linked?: TableRpcLinkedTable[];
}

// Public version of TableRpc, available for developers to use
export interface TableRpcSimplified extends Omit<TableRpc, 'insert' | 'update' | 'delete'> {
  insert?: boolean | TableRpc['insert'];
  update?: boolean | TableRpc['update'];
  delete?: boolean | TableRpc['delete'];
}

export type TableRpcResultSelectRecord = Record<string, any>;

export interface TableRpcResultSelectDTO {
  records: TableRpcResultSelectRecord[];
  totalRecords: number;
}

export interface TableRpcResultSelectLinkedRecordsDTO {
  records: TableRpcResultSelectRecord[];
  totalRecords: number;
}

export interface TableRpcResultInsertDTO {}

export interface TableRpcResultUpdateDTO {}
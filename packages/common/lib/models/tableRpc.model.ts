import { RelationalDatabaseSchemaTable } from "./databaseSchema.model";

export interface TableRPCInputBase {}

export interface TableRPCInputSpec extends TableRPCInputBase {}

export enum TableRPCInputSelectOperator {
  equal = 'equal',
  notEqual = 'not equal',
}

export interface TableRPCInputSelect extends TableRPCInputBase {
  page: number;
  search?: string;
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  filters?: {
    column: string;
    operator: keyof typeof TableRPCInputSelectOperator;
    value: any;
  }[];

  tableSchema: RelationalDatabaseSchemaTable;
}

export interface TableRPCInputSelectLinkedRecords extends TableRPCInputBase {
  linkedItemIndex: number;
  
  page: number;
  search?: string;
  
  // For selecting particular records
  primaryKeyValues?: (string | number)[];
}

export interface TableRPCInputInsert extends TableRPCInputBase {
  values: Record<string, any>;

  tableSchema: RelationalDatabaseSchemaTable;
}

export interface TableRPCInputUpdate extends TableRPCInputBase {
  primaryKeys: (string | number)[];
  values: Record<string, any>;

  tableSchema: RelationalDatabaseSchemaTable;
}

export interface TableRPCInputDelete extends TableRPCInputBase {
  primaryKeys: any[];
}

export interface TableRPCSelectLinkedTableOneToOne {
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

export interface TableRPCSelectLinkedTableOneToMany {
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
// export interface TableRPCSelectLinkedTableManyToMany {
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

export type TableRPCSelectLinkedTable = TableRPCSelectLinkedTableOneToOne | TableRPCSelectLinkedTableOneToMany;

export interface TableRPCSelect {
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
  
  // For linking tables
  linked?: TableRPCSelectLinkedTable[];
}

export interface TableRPCInsert {
  columns?: string[];
  excludeColumns?: string[];
  beforeInsert?: (record: Record<string, any>) => Record<string, any>;
  // getDefaultValues?: (record: Record<string, any>) => Record<string, any>;
  canBeInserted?: (record: Record<string, any>) => boolean;
}

export interface TableRPCUpdate extends Omit<TableRPCInsert, 'canBeInserted' | 'beforeInsert'> {
  canBeUpdated?: (record: Record<string, any>) => boolean;
  beforeUpdate?: (record: Record<string, any>) => Record<string, any>;
}

export interface TableRPCDelete {
  canBeDeleted?: (record: Record<string, any>) => boolean;
}

export interface TableRPC {
  primaryKeyColumn: string;
  table: string;
  select: TableRPCSelect;
  insert?: TableRPCInsert;
  update?: TableRPCUpdate;
  delete?: TableRPCDelete;
}

// Public version of TableRPC, available for developers to use
export interface TableRPCSimplified extends Omit<TableRPC, 'insert' | 'update' | 'delete'> {
  insert?: boolean | TableRPC['insert'];
  update?: boolean | TableRPC['update'];
  delete?: boolean | TableRPC['delete'];
}

export type TableRPCResultSelectRecord = Record<string, any>;

export interface TableRPCResultSelectDTO {
  records: TableRPCResultSelectRecord[];
  totalRecords: number;
}

export interface TableRPCResultSelectLinkedRecordsDTO {
  records: TableRPCResultSelectRecord[];
  totalRecords: number;
}

export interface TableRPCResultInsertDTO {}

export interface TableRPCResultUpdateDTO {}
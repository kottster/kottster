import { RelationalDatabaseSchema } from "./databaseSchema.model";

export enum DataSourceType {
  postgres = 'postgres',
  mysql = 'mysql',
  mariadb = 'mariadb',
  mssql = 'mssql',
  mongodb = 'mongodb',
  sqlite = 'sqlite',
  firebase = 'firebase',
}

export enum DataSourceAdapterType {
  knex_pg = 'knex_pg', // PostgreSQL
  knex_mysql2 = 'knex_mysql2', // MySQL, MariaDB
  knex_tedious = 'knex_tedious', // MSSQL
  knex_better_sqlite3 = 'knex_better_sqlite3', // SQLite
}

export type DataSourceAdapterConfig = {
  /**
   * Function to execute after a record is inserted.
   * This can be used to perform custom actions after insertion
   * @param table - The table where the record was inserted
   * @param primaryKey - The primary key of the record that was inserted
   * @param values - The values of the record that was inserted
   */
  afterInsert?: (table: string, primaryKey: any, values: Record<string, any>) => void | Promise<void>;

  /**
   * Function to execute after a record is updated.
   * This can be used to perform custom actions after update
   * @param table - The table where the record was updated
   * @param primaryKeyColumn - The primary key column of the record
   * @param values - The values of the record that was updated
   */
  afterUpdate?: (table: string, primaryKey: any, values: Record<string, any>) => void | Promise<void>;

  /**
   * Function to execute after a record is deleted.
   * This can be used to perform custom actions after deletion
   * @param table - The table where the record was deleted
   * @param primaryKey - The primary key of the record that was deleted
   */
  afterDelete?: (table: string, primaryKey: any, values: Record<string, any>) => void | Promise<void>;
}

export interface DataSourceTypeInfo {
  type: DataSourceType;
  name: string;
  icon: string;
  isActive: boolean;
}

enum DataSourceStatus {
  idle = 'idle',
  loading = 'loading',
  loaded = 'loaded',
  error = 'error',
}

export interface DataSource<T = any> {
  version: string;
  type: DataSourceType;
  name: string;
  adapter: T;
  tablesConfig: DataSourceTablesConfig;
  config: DataSourceAdapterConfig;
  status: keyof typeof DataSourceStatus;

  // Only for database data sources
  databaseSchemas?: string[];
}

// Available on the client side
export interface PublicDataSource extends Omit<DataSource, 'adapter'> {
  name: string;
  adapterType: DataSourceAdapterType;
  databaseSchema?: RelationalDatabaseSchema;
}

export type DataSourceTablesConfig = Record<string, DataSourceTableConfig>;

export type DataSourceTableConfig = {
  /** Exclude the table */
  excluded?: boolean;

  /** Include the table */
  included?: boolean;

  /** Exclude the columns */
  excludedColumns?: string[];

  /** Forbid insertions on the table */
  preventInsert?: boolean;

  /** Forbid updates on the table */
  preventUpdate?: boolean;

  /** Forbid deletions on the table */
  preventDelete?: boolean;
};

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
  type: DataSourceType;
  name: string;
  adapter: T;
  tablesConfig: DataSourceTablesConfig;
  status: keyof typeof DataSourceStatus;

  // Only for database data sources
  databaseSchemas?: string[];
}

// Available on the client side
export interface PublicDataSource extends Omit<DataSource, 'adapter' | 'tablesConfig'> {
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

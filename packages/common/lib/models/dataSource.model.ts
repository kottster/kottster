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

export interface DataSource<T = any> {
  type: DataSourceType;
  name: string;
  adapter: T;

  // Only for database data sources
  databaseSchemas?: string[];
}

// Available in the public API
export interface PublicDataSource extends Omit<DataSource, 'adapter'> {
  adapterType: DataSourceAdapterType;
}

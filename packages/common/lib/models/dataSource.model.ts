export enum DataSourceType {
  postgres = 'postgres',
  mysql = 'mysql',
  mariadb = 'mariadb',
  mssql = 'mssql',
}

export enum DataSourceAdapterType {
  knex_pg = 'knex_pg', // PostgreSQL
  knex_mysql2 = 'knex_mysql2', // MySQL, MariaDB
  knex_tedious = 'knex_tedious', // MSSQL
}

export interface DataSourceTypeInfo {
  type: DataSourceType;
  name: string;
  icon: string;
  isActive: boolean;
}

export interface DataSource {
  type: DataSourceType;
  ctxPropName: string;
  adapter: any;

  // Only for database data sources
  databaseSchemas?: string[];
}

// Available in the public API
export interface PublicDataSource extends Omit<DataSource, 'adapter'> {
  adapterType: DataSourceAdapterType;
}

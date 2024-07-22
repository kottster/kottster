export enum DataSourceType {
  postgres = 'postgres',
  mysql = 'mysql',
  mariadb = 'mariadb',
  mssql = 'mssql',
  oracle = 'oracle',
  sqlite = 'sqlite',
}

export enum DataSourceClientType {
  knex_pg = 'knex_pg', // PostgreSQL
  knex_mysql2 = 'knex_mysql2', // MySQL, MariaDB
  knex_tedious = 'knex_tedious', // MSSQL
}

export interface DataSourceTypeInfo {
  type: DataSourceType;
  name: string;
  icon: string;
}

export interface DataSource {
  type: DataSourceType;
  contextPropName: string;

  clientType: DataSourceClientType;
  client: unknown;
}

// Available in the public API
export interface PublicDataSource extends Omit<DataSource, 'client' | 'clientType'> {}

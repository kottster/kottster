import { DataSourceType, DataSourceTypeInfo } from "../models/dataSource.model";

export const dataSourceTypes: DataSourceTypeInfo[] = [
  {
    type: DataSourceType.postgres,
    name: 'PostgreSQL',
    icon: '/icons/postgresql.svg',
  },
  {
    type: DataSourceType.mysql,
    name: 'MySQL',
    icon: '/icons/mysql.svg',
  },
  {
    type: DataSourceType.mariadb,
    name: 'MariaDB',
    icon: '/icons/mariadb.svg',
  },
  {
    type: DataSourceType.mssql,
    name: 'Microsoft SQL',
    icon: '/icons/mssql.svg',
  },
  {
    type: DataSourceType.oracle,
    name: 'Oracle',
    icon: '/icons/oracle.svg',
  },
  {
    type: DataSourceType.sqlite,
    name: 'SQLite',
    icon: '/icons/sqlite.svg',
  },
];
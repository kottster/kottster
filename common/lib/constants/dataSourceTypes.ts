import { DataSourceType, DataSourceTypeInfo } from "../models/dataSource.model";

export const dataSourceTypes: DataSourceTypeInfo[] = [
  {
    type: DataSourceType.postgres,
    name: 'PostgreSQL',
    icon: '/icons/postgresql.svg',
    isActive: true,
  },
  {
    type: DataSourceType.mysql,
    name: 'MySQL',
    icon: '/icons/mysql.svg',
    isActive: true,
  },
  {
    type: DataSourceType.mariadb,
    name: 'MariaDB',
    icon: '/icons/mariadb.svg',
    isActive: true,
  },
  {
    type: DataSourceType.mssql,
    name: 'Microsoft SQL',
    icon: '/icons/mssql.svg',
    isActive: true,
  },
  {
    type: DataSourceType.oracle,
    name: 'Oracle',
    icon: '/icons/oracle.svg',
    isActive: false,
  },
  {
    type: DataSourceType.sqlite,
    name: 'SQLite',
    icon: '/icons/sqlite.svg',
    isActive: false,
  },
];
import { DataSourceType, DataSourceTypeInfo } from "../models/dataSource.model";

export const dataSourceTypes: DataSourceTypeInfo[] = [
  {
    type: DataSourceType.mysql,
    name: 'MySQL',
    icon: 'https://web.kottster.app/icons/mysql.svg',
    isActive: true,
  },
  {
    type: DataSourceType.postgres,
    name: 'PostgreSQL',
    icon: 'https://web.kottster.app/icons/postgresql.svg',
    isActive: true,
  },
  {
    type: DataSourceType.mariadb,
    name: 'MariaDB',
    icon: 'https://web.kottster.app/icons/mariadb.svg',
    isActive: true,
  },
  {
    type: DataSourceType.mssql,
    name: 'MS SQL',
    icon: 'https://web.kottster.app/icons/mssql.svg',
    isActive: false,
  },
  {
    type: DataSourceType.mongodb,
    name: 'MongoDB',
    icon: 'https://web.kottster.app/icons/mongodb.svg',
    isActive: false,
  },
  {
    type: DataSourceType.sqlite,
    name: 'SQLite',
    icon: 'https://web.kottster.app/icons/sqlite.svg',
    isActive: false,
  },
];
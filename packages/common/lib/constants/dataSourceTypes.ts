import { DataSourceType, DataSourceTypeInfo } from "../models/dataSource.model";

export const dataSourceTypes: DataSourceTypeInfo[] = [
  {
    type: DataSourceType.mysql,
    name: 'MySQL',
    icon: 'https://web.kottster.app/icons/mysql.svg',
    isActive: true,
    bgColor: '#dae8ef',
  },
  {
    type: DataSourceType.postgres,
    name: 'PostgreSQL',
    icon: 'https://web.kottster.app/icons/postgresql.svg',
    isActive: true,
    bgColor: '#cdd9e4',
  },
  {
    type: DataSourceType.mariadb,
    name: 'MariaDB',
    icon: 'https://web.kottster.app/icons/mariadb.svg',
    isActive: true,
    bgColor: '#cdd9e4',
  },
  {
    type: DataSourceType.sqlite,
    name: 'SQLite',
    icon: 'https://web.kottster.app/icons/sqlite.svg',
    isActive: true,
    bgColor: '#c9e0f3',
  },
  {
    type: DataSourceType.mssql,
    name: 'Microsoft SQL',
    icon: 'https://web.kottster.app/icons/mssql.svg',
    isActive: true,
    bgColor: '#ead8d8',
  },
  {
    type: DataSourceType.mongodb,
    name: 'MongoDB',
    icon: 'https://web.kottster.app/icons/mongodb.svg',
    isActive: false,
  },
  {
    type: DataSourceType.firebase,
    name: 'Firebase',
    icon: 'https://web.kottster.app/icons/firebase.svg',
    isActive: false,
  },
];
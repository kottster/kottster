import { DataSourceType, DataSourceTypeInfo } from "../models/dataSource.model";

export const dataSourceTypes: DataSourceTypeInfo[] = [
  {
    type: DataSourceType.postgres,
    name: 'PostgreSQL',
    icon: 'https://web.kottster.app/icons/postgresql.svg',
    isActive: true,
  },
  {
    type: DataSourceType.mysql,
    name: 'MySQL',
    icon: 'https://web.kottster.app/icons/mysql.svg',
    isActive: true,
  },
  {
    type: DataSourceType.mariadb,
    name: 'MariaDB',
    icon: 'https://web.kottster.app/icons/mariadb.svg',
    isActive: true,
  },
];
import { DataSourceType } from "../models/dataSource.model";

type Packages = Record<string, string>;

export interface DataSourceTypeData {
  packages: Packages;
  fileTemplateName: string; 
  knexClientStr: string;
}

const knexPackages: Record<string, string> = {
  'knex': '^3.x',
};

export const dataSourcesTypeData: Record<string, DataSourceTypeData> = {
  [DataSourceType.postgres]: {
    packages: {
      ...knexPackages,
      'pg': '^8.7.1',
    },
    fileTemplateName: 'app/_server/data-sources/postgres/index.js',
    knexClientStr: 'pg',
  },
  [DataSourceType.mysql]: {
    packages: {
      ...knexPackages,
      'mysql2': '^2.3.0',
    },
    fileTemplateName: 'app/_server/data-sources/mysql/index.js',
    knexClientStr: 'mysql2',
  },
  [DataSourceType.mariadb]: {
    packages: {
      ...knexPackages,
      'mysql2': '^2.3.0',
    },
    fileTemplateName: 'app/_server/data-sources/mariadb/index.js',
    knexClientStr: 'mysql2',
  },
  [DataSourceType.mssql]: {
    packages: {
      ...knexPackages,
      'tedious': '^18.0.0',
    },
    fileTemplateName: 'app/_server/data-sources/mssql/index.js',
    knexClientStr: 'mssql',
  },
  [DataSourceType.sqlite]: {
    packages: {
      ...knexPackages,
      'better-sqlite3': '^11.8.1',
    },
    fileTemplateName: 'app/_server/data-sources/sqlite/index.js',
    knexClientStr: 'better-sqlite3',
  },
};

export default dataSourcesTypeData;

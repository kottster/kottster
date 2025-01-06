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
    fileTemplateName: 'app/.server/data-sources/postgres/index.js',
    knexClientStr: 'pg',
  },
  [DataSourceType.mysql]: {
    packages: {
      ...knexPackages,
      'mysql2': '^2.3.0',
    },
    fileTemplateName: 'app/.server/data-sources/mysql/index.js',
    knexClientStr: 'mysql2',
  },
  [DataSourceType.mariadb]: {
    packages: {
      ...knexPackages,
      'mysql2': '^2.3.0',
    },
    fileTemplateName: 'app/.server/data-sources/mariadb/index.js',
    knexClientStr: 'mysql2',
  },
  [DataSourceType.mssql]: {
    packages: {
      ...knexPackages,
      'tedious': '^11.0.0',
    },
    fileTemplateName: 'app/.server/data-sources/mssql/index.js',
    knexClientStr: 'tedious',
  },
};

export default dataSourcesTypeData;

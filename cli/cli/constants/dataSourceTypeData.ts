import { DataSourceType } from "@kottster/common";
import { FileTemplateManager } from "../services/fileTemplateManager.service";

type Packages = Record<string, string>;

interface DataSourceTypeData {
  packages: Packages;
  fileTemplateName: keyof typeof FileTemplateManager.templates; 
}

const knexPackages: Record<string, string> = {
  'knex': '^3.x',
};

const dataSourcesTypeData: Record<DataSourceType, DataSourceTypeData> = {
  [DataSourceType.postgres]: {
    packages: {
      ...knexPackages,
      'pg': '^8.7.1',
    },
    fileTemplateName: 'src/server/data-sources/postgres/index.js'
  },
  [DataSourceType.mysql]: {
    packages: {
      ...knexPackages,
      'mysql2': '^2.3.0',
    },
    fileTemplateName: 'src/server/data-sources/mysql/index.js'
  },
  [DataSourceType.mariadb]: {
    packages: {
      ...knexPackages,
      'mysql2': '^2.3.0',
    },
    fileTemplateName: 'src/server/data-sources/mariadb/index.js'
  },
  [DataSourceType.mssql]: {
    packages: {
      ...knexPackages,
      'tedious': '^11.0.0',
    },
    fileTemplateName: 'src/server/data-sources/mssql/index.js'
  },
};

export default dataSourcesTypeData;

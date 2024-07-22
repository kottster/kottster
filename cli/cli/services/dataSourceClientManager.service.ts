import { DataSourceClientType, DataSourceType } from "@kottster/common";
import { FileTemplateManager } from "./fileTemplateManager.service";

type Packages = Record<string, string>;

interface DataSourceClientData {
  clientType: DataSourceClientType;
  type: DataSourceType;
  packages: Packages;
  fileTemplateName: keyof typeof FileTemplateManager.templates; 
}

const knexPackages = {
  'knex': '^0.95.6',
  'knex-paginate': '^1.0.0',
};

/**
 * Data source client manager
 */
export class DataSourceClientManager {
  static dataSources: DataSourceClientData[] = [
    {
      clientType: DataSourceClientType.knex_pg,
      type: DataSourceType.postgres,
      packages: {
        ...knexPackages,
        'pg': '^8.7.1',
      },
      fileTemplateName: 'src/server/data-sources/postgres/index.js'
    },
    {
      clientType: DataSourceClientType.knex_mysql2,
      type: DataSourceType.mysql,
      packages: {
        ...knexPackages,
        'mysql2': '^2.3.0',
      },
      fileTemplateName: 'src/server/data-sources/mysql/index.js'
    },
    {
      clientType: DataSourceClientType.knex_mysql2,
      type: DataSourceType.mariadb,
      packages: {
        ...knexPackages,
        'mysql2': '^2.3.0',
      },
      fileTemplateName: 'src/server/data-sources/mariadb/index.js'
    },
    {
      clientType: DataSourceClientType.knex_tedious,
      type: DataSourceType.mssql,
      packages: {
        ...knexPackages,
        'tedious': '^11.0.0',
      },
      fileTemplateName: 'src/server/data-sources/mssql/index.js'
    },
  ];

  /**
   * Get a template
   * @param name Template name
   * @returns The file content
   */
  public static get(type: DataSourceType): DataSourceClientData {
    const dataSource = this.dataSources.find(ds => ds.type === type);
    if (!dataSource) {
      throw new Error(`Data source client ${type} not found`);
    }

    return dataSource;
  };
}

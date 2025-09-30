import { InternalApiBody, InternalApiResult } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { KottsterApi } from "../services/kottsterApi.service";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";

/**
 * Generate SQL query
 */
export class GenerateSql extends DevAction {
  public async execute(data: InternalApiBody<'generateSql'>): Promise<InternalApiResult<'generateSql'>> {
    const kottsterApi = new KottsterApi();
    
    const kottsterApiToken = this.app.getKottsterApiToken();
    if (!kottsterApiToken) {
      throw new Error('Kottster API token is not set. Please set it in the config.');
    }

    const dataSources = this.app.getDataSources();
    const dataSource = dataSources.find(ds => ds.name === data.dataSourceName);
    if (!dataSource) {
      throw new Error(`Data source "${data.dataSourceName}" not found.`);
    }

    const dataSourceAdapter = dataSource.adapter as DataSourceAdapter;
    const databaseSchema = await dataSourceAdapter.getDatabaseSchema();

    const result = await kottsterApi.generateSql(this.app.appId, kottsterApiToken, {
      request: data.request,
      dataSource: {
        name: dataSource.name,
        adapterType: (dataSource.adapter as DataSourceAdapter).type,
        status: dataSource.status,
        type: dataSource.type,
        databaseSchema,
      },
      params: data.params,
    });
    if (!result) {
      throw new Error('Failed to generate SQL query.');
    }

    return result;
  }
}
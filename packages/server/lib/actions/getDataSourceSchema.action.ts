import { InternalApiBody, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";

/**
 * Get the data source schema
 */
export class GetDataSourceSchema extends Action {
  public async execute({ name }: InternalApiBody<'getDataSourceSchema'>): Promise<InternalApiResult<'getDataSourceSchema'>> {
    const dataSources = this.app.getDataSources();
    const dataSource = dataSources.find((ds) => ds.name === name);
    if (!dataSource) {
      throw new Error(`Data source with name ${name} not found`);
    }

    try {
      const adapter = dataSource.adapter as DataSourceAdapter;
      const databaseSchema = await adapter.getDatabaseSchema();
      const cleanDatabaseSchema = adapter.removeExcludedTablesAndColumns(databaseSchema);
      
      return cleanDatabaseSchema;
    } catch (error) {
      throw new Error(`Failed to get database schema: ${error.message}`);
    }
  }
}
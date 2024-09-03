import { DataSource } from "@kottster/common";
import { Action } from "../models/action.model";
import { RelationalDatabaseSchema } from "../models/databaseSchema.model";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";

interface Data {
  ctxPropName: DataSource['ctxPropName'];
  databaseSchema?: string;
}

interface Result {
  relationalDatabaseSchema: RelationalDatabaseSchema;
}

/**
 * Get the data source info
 */
export class GetDataSource extends Action {
  public async execute({ ctxPropName }: Data): Promise<Result> {
    const dataSources = this.app.getDataSources();
    const dataSource = dataSources.find((ds) => ds.ctxPropName === ctxPropName);
    if (!dataSource) {
      throw new Error(`Data source with ctxPropName ${ctxPropName} not found`);
    }

    try {
      const adapter = dataSource.adapter as DataSourceAdapter;
      const databaseSchema = await adapter.getDatabaseSchema();
      
      return {
        relationalDatabaseSchema: databaseSchema
      };
    } catch (error) {
      throw new Error(`Failed to get database schema: ${error.message}`);
    }
  }
}
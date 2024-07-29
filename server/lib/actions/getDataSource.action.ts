import { DataSource } from "@kottster/common";
import { Action } from "../models/action.model";
import { RelationalDatabaseSchema } from "../models/databaseSchema.model";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";

interface Data {
  contextPropName: DataSource['contextPropName'];
  databaseSchema?: string;
}

interface Result {
  relationalDatabaseSchema: RelationalDatabaseSchema;
}

/**
 * Get the data source info
 */
export class GetDataSource extends Action {
  public async execute({ contextPropName }: Data): Promise<Result> {
    const dataSources = this.app.getDataSources();
    const dataSource = dataSources.find((ds) => ds.contextPropName === contextPropName);
    if (!dataSource) {
      throw new Error(`Data source with contextPropName ${contextPropName} not found`);
    }

    const adapter = dataSource.adapter as DataSourceAdapter;
    const databaseSchema = await adapter.getDatabaseSchema();
    
    return {
      relationalDatabaseSchema: databaseSchema
    };
  }
}
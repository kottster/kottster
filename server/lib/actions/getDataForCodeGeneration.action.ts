import { DataSource } from "@kottster/common";
import { Action } from "../models/action.model";
import { DatabaseSchema } from "../models/databaseSchema.model";
import { DataSourceManager } from "../services/dataSourceManager.service";

interface Data {
  contextPropName: DataSource['contextPropName'];
}

interface Result {
  databaseSchema: DatabaseSchema;
}

/**
 * Get the data needed for code generation.
 */
export class GetDataForCodeGeneration extends Action {
  public async execute({ contextPropName }: Data): Promise<Result> {
    const dataSources = this.app.getDataSources();
    const dataSource = dataSources.find((ds) => ds.contextPropName === contextPropName);
    if (!dataSource) {
      throw new Error(`Data source with contextPropName ${contextPropName} not found`);
    }

    const dataSourceClient = DataSourceManager.getClient(dataSource);
    const databaseSchema = await dataSourceClient.getDatabaseSchema();
    
    return {
      databaseSchema
    };
  }
}
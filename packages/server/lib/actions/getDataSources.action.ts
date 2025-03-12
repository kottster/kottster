import { PublicDataSource } from "@kottster/common";
import { Action } from "../models/action.model";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";

type Result = PublicDataSource[];

/**
 * Get the data sources
 */
export class GetDataSources extends Action {
  public async execute(): Promise<Result> {
    const dataSources = this.app.getDataSources();
    
    const databaseSchemas = await Promise.all(dataSources.map(async (ds) => {
      return (ds.adapter as DataSourceAdapter).getDatabaseSchema();
    }));

    return dataSources.map((ds, i) => ({ 
      type: ds.type,
      name: ds.name,
      adapterType: (ds.adapter as DataSourceAdapter).type,
      databaseSchema: databaseSchemas[i],
    } as PublicDataSource));
  }
}
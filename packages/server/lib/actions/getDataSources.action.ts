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
    
    return dataSources.map(ds => ({ 
      type: ds.type,
      name: ds.name,
      adapterType: (ds.adapter as DataSourceAdapter).type
    } as PublicDataSource));
  }
}
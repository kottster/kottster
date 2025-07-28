import { PublicDataSource } from "@kottster/common";
import { Action } from "../models/action.model";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";

interface Data {
  withSchema?: boolean;
}

/**
 * Get the data sources
 */
export class GetDataSources extends Action {
  public async execute(data: Data): Promise<PublicDataSource[]> {
    const dataSources = this.app.getDataSources();
    
    const databaseSchemas = data.withSchema ? await Promise.all(dataSources.map(async (ds) => {
      ds.status = 'loading';
      try {
        const schema = await (ds.adapter as DataSourceAdapter).getDatabaseSchema();
        ds.status = 'loaded';
        return schema;
      } catch (error) {
        ds.status = 'error';
        console.warn(`Failed to get database schema for data source ${ds.name}:`, error);
        return null;
      }
    })) : [];

    return dataSources.map((ds, i) => ({ 
      type: ds.type,
      name: ds.name,
      status: ds.status,
      adapterType: (ds.adapter as DataSourceAdapter).type,
      databaseSchema: databaseSchemas[i] ?? null,
    } as PublicDataSource));
  }
}
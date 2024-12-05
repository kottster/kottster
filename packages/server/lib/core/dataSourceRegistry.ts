import { DataSource, PublicDataSource } from "@kottster/common";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";

/**
 * The data source registry
 */
export class DataSourceRegistry<T extends Record<string, DataSource>> {
  public dataSources: T;

  constructor(dataSources: DataSource[]) {
    this.dataSources = {} as T;
    dataSources.forEach((ds) => {
      (this.dataSources as Record<string, DataSource>)[ds.name] = ds;
    });
  }

  public getDataSourcesForAppProvider(): PublicDataSource[] {
    return Object.values(this.dataSources).map((ds) => ({
      name: ds.name,
      adapter: ds.adapter,
      type: ds.type,
      adapterType: (ds.adapter as DataSourceAdapter)?.type,
    }));
  }

  /**
   * Connect to all registered data sources
   */
  public connectToDataSources(): void {
    Object.values(this.dataSources).forEach((dataSource) => {
      dataSource.adapter.connect();

      // Ping the database to check if the connection is successful
      dataSource.adapter.pingDatabase();
    });
  }
}
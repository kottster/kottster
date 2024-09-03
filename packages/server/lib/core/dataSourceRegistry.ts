import { DataSource } from "@kottster/common";

/**
 * The data source registry
 */
export class DataSourceRegistry<T extends Record<string, DataSource>> {
  public dataSources: T;

  constructor(dataSources: DataSource[]) {
    this.dataSources = {} as T;
    dataSources.forEach((ds) => {
      (this.dataSources as Record<string, DataSource>)[ds.ctxPropName] = ds;
    });
  }

  /**
   * Connect to the data sources
   */
  public connectToDataSources(): void {
    Object.values(this.dataSources).forEach((dataSource) => {
      dataSource.adapter.connect();

      // Ping the database to check if the connection is successful
      dataSource.adapter.pingDatabase();
    });
  }
}
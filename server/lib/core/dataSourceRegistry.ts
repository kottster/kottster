import { DataSource } from "@kottster/common";

export class DataSourceRegistry<T extends Record<string, DataSource>> {
  public dataSources: T;

  constructor(dataSources: DataSource[]) {
    this.dataSources = {} as T;
    dataSources.forEach((ds) => {
      (this.dataSources as Record<string, DataSource>)[ds.contextPropName] = ds;
    });
  }
}
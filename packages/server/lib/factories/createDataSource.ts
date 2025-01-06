import { DataSource } from "@kottster/common";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";

interface CreateDataSource<T extends DataSourceAdapter> {
  type: DataSource['type'];
  name: DataSource['name'];
  init: () => T;
  
  // Only for database data sources
  databaseSchemas?: DataSource['databaseSchemas'];
}

/**
 * Create a data source
 * @param type - The type of the data source
 * @param name - The name of the context property, e.g. 'knex'
 * @param databaseSchemas - The available database schemas
 * @param init - The function to initialize the data source adapter
 * @returns The initialized data source
 */
export function createDataSource<T extends DataSourceAdapter>({ 
  type, 
  name, 
  databaseSchemas, 
  init 
}: CreateDataSource<T>): DataSource<T> {
  const adapter = init();
  adapter.setDatabaseSchemas(databaseSchemas ?? []);
  
  return {
    type,
    name,
    databaseSchemas,
    adapter,
  };
}

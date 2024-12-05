import { DataSource } from "@kottster/common";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";

interface CreateDataSource {
  type: DataSource['type'];
  name: DataSource['name'];
  init: () => DataSourceAdapter;
  
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
export function createDataSource({ type, name, databaseSchemas, init }: CreateDataSource): DataSource {
  const adapter = init();
  adapter.setDatabaseSchemas(databaseSchemas ?? []);
  
  return {
    type,
    name,
    databaseSchemas,
    adapter,
  };
}

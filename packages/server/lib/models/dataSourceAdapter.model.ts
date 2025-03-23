import { Knex } from "knex";
import { DataSourceAdapterType, FormField, JsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn, RelationalDatabaseSchemaTable, TableRpcInputDelete, TableRpcInputInsert, TableRpcInputSelect, TableRpcInputUpdate, TableRpcResultInsertDTO, TableRpcResultSelectDTO, TableRpcResultSelectRecord, TableRpcResultUpdateDTO, TableRpcResultSelectRecordLinkedDTO, defaultTablePageSize, TableRpcInputSelectUsingExecuteQuery, TableRpcInputSelectSingle, TableRpcResultSelectSingleDTO, findLinkedItem, DataSourceTablesConfig, getTableData, TableRpc, FilterItem } from "@kottster/common";
import { KottsterApp } from "../core/app";
import { OneToOneRelation } from "./oneToOneRelation";
import { OneToManyRelation } from "./oneToManyRelation";
import { ManyToManyRelation } from "./manyToManyRelation";

/**
 * The base class for all data source adapters
 * @abstract
 */
export abstract class DataSourceAdapter {
  abstract type: DataSourceAdapterType;
  protected databaseSchemas: string[];
  private app: KottsterApp;
  private tablesConfig: DataSourceTablesConfig;
  private cachedFullDatabaseSchemaSchema: RelationalDatabaseSchema | null = null;

  constructor(protected client: Knex) {}

  /**
   * Set the app instance
   */
  public setApp(app: KottsterApp): void {
    this.app = app;
  }

  /**
   * Set the tables config
   */
  public setTablesConfig(tablesConfig: DataSourceTablesConfig): void {
    this.tablesConfig = tablesConfig;
  }

  /**
   * Get the database schemas
   */
  setDatabaseSchemas(databaseSchemas: string[]): void {
    this.databaseSchemas = databaseSchemas
  }

  /**
   * Get the client
   * @returns The client
   */
  getClient(): Knex {
    return this.client;
  }

  /**
   * Remove excluded tables and columns from the schema
   * @returns The schema without the excluded tables and columns based on the tables config
   */
  public removeExcludedTablesAndColumns(schema: RelationalDatabaseSchema): RelationalDatabaseSchema {
    if (!this.tablesConfig) {
      return schema;
    }

    const tablesConfig = this.tablesConfig;
    const tables = schema.tables.filter(table => {
      if (tablesConfig[table.name]?.excluded) {
        return false;
      }

      const excludedColumns = tablesConfig[table.name]?.excludedColumns;
      if (excludedColumns) {
        table.columns = table.columns.filter(column => !excludedColumns.includes(column.name));
      }

      return true;
    });

    return {
      ...schema,
      tables,
    };
  }

  abstract getDatabaseSchemaRaw(): Promise<RelationalDatabaseSchema>;
  
  /**
   * Get the database schema
   * @returns The database schema
   */
  async getDatabaseSchema(): Promise<RelationalDatabaseSchema> {
    let databaseSchema: RelationalDatabaseSchema;
  
    if (this.cachedFullDatabaseSchemaSchema) {
      databaseSchema = this.cachedFullDatabaseSchemaSchema;
    } else {
      databaseSchema = await this.getDatabaseSchemaRaw();
      
      // Save the full database schema in the cache
      this.cachedFullDatabaseSchemaSchema = this.removeExcludedTablesAndColumns(databaseSchema);
      console.log('Database schema cached');
      
      return this.cachedFullDatabaseSchemaSchema;
    }
    
    return this.removeExcludedTablesAndColumns(databaseSchema);
  };

  /**
   * Process the column
   * @returns The processed column
   */
  abstract processColumn(column: RelationalDatabaseSchemaColumn): { 
    isArray: boolean;
    formField: FormField;
    returnedJsType: keyof typeof JsType;
    returnedAsArray: boolean;
  };

  /**
   * Prepare the record value before returning it to the client
   * @example Convert date to ISO string, pg string-like array to js array, etc.
   * @returns The transformed value
   */
  abstract prepareRecordValue(value: any, columnSchema: RelationalDatabaseSchemaColumn): Promise<any>;

  /**
   * Prepare the record value before inserting/updating it into the database
   * @example Remove timezone from date for MySQL, etc.
   * @returns The transformed value
   */
  abstract prepareRecordValueBeforeUpsert(value: any, columnSchema: RelationalDatabaseSchemaColumn): Promise<any>;

  /**
   * Get the search builder that will apply the search query
   * @returns The search builder
   */
  abstract getSearchBuilder(searchableColumns: string[], searchValue: string): (builder: Knex.QueryBuilder) => void;

  /**
   * Get the filter builder that will apply the filter query
   * @returns The filter builder
   */
  abstract getFilterBuilder(filterItems: FilterItem[]): (builder: Knex.QueryBuilder) => void;

  /**
   * Get the table records (Table RPC)
   * @returns The table records
   */
  async getTableRecords(input: TableRpcInputSelect, databaseSchema: RelationalDatabaseSchema, tableRpcDefault: TableRpc): Promise<TableRpcResultSelectDTO> {
    const tableRpc = input.tableRpc ?? tableRpcDefault;
    const { 
      linked, 
      tableSchema, 
      searchableColumns, 
      sortableColumns, 
      primaryKeyColumn,
    } = getTableData({ tableRpc, databaseSchema });
    const executeQuery = tableRpc.executeQuery;
    const table = tableRpc.table;
    const columns = tableRpc.columns;
    const where = tableRpc.where;
    const orderBy = tableRpc.orderBy;
    const hiddenColumns = tableRpc.hiddenColumns;
    const hiddenLinkedItems = tableRpc.hiddenLinkedItems;
    const pageSize = ((input.pageSize > 1000 ? 1000 : input.pageSize) || tableRpc.pageSize || defaultTablePageSize);

    // If a custom query is provided, execute it and return the result directly
    if (executeQuery) {
      return executeQuery(input as TableRpcInputSelectUsingExecuteQuery);
    }

    if (!tableSchema) {
      throw new Error('Table schema not provided');
    }
    
    if (!table || !primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }

    if (this.tablesConfig[table]?.excluded) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }
    
    const query = this.client(table);
    const countQuery = this.client(table);

    // Selecting records by a specific foreign record
    if (input.getByForeignRecord) {
      const { linkedItem, recordPrimaryKeyValue } = input.getByForeignRecord;
      if (linkedItem.relation === 'oneToMany') {
        query.where(linkedItem.targetTableForeignKeyColumn, recordPrimaryKeyValue);
        countQuery.where(linkedItem.targetTableForeignKeyColumn, recordPrimaryKeyValue);
      }
    }

    // Select specific columns
    if (columns && columns.length > 0) {
      if (primaryKeyColumn && !columns.includes(primaryKeyColumn)) {
        columns.push(primaryKeyColumn);
      }
      query.select(columns);
    } else {
      query.select('*');
    }
    countQuery.count({ count: '*' });

    // Apply where conditions
    if (where && where.length > 0) {
      where.forEach(condition => {
        query.where(condition.column, condition.operator, condition.value);
        countQuery.where(condition.column, condition.operator, condition.value);
      });
    }

    // Apply search
    if (input.search) {
      const searchValue = input.search.trim();

      if (searchableColumns && searchableColumns.length > 0) {
        query.where(this.getSearchBuilder(searchableColumns, searchValue));
        countQuery.where(this.getSearchBuilder(searchableColumns, searchValue));
      }
    }

    // Apply ordering
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach(order => {
        if (sortableColumns && sortableColumns.includes(order.column)) {
          query.orderBy(order.column, order.direction);
        }
      });
    } else if (input.sorting) {
      if (sortableColumns && sortableColumns.includes(input.sorting.column)) {
        query.orderBy(input.sorting.column, input.sorting.direction);
      }
    } else {
      // By default, order by the primary key column
      query.orderBy(primaryKeyColumn, 'desc');
    }

    // Apply filters
    if (input.filters?.length) {
      query.where(this.getFilterBuilder(input.filters));
      countQuery.where(this.getFilterBuilder(input.filters));
    }

    // Apply pagination
    const offset = (input.page - 1) * pageSize;
    query
      .limit(pageSize)
      .offset(offset);

    const [records, [{ count }]] = await Promise.all([
      query,
      countQuery
    ]);

    // If excluded columns are provided, remove them from all records
    if (this.tablesConfig[table]?.excludedColumns) {
      records.forEach(record => {
        this.tablesConfig[table].excludedColumns?.forEach(column => {
          delete record[column];
        });
      });
    }

    const linkedOneToOne = Object.fromEntries(
      Object.entries(linked ?? {})
        .filter(([, linkedItem]) => linkedItem.relation === 'oneToOne' && !hiddenColumns?.includes(linkedItem.foreignKeyColumn))
    ) as Record<string, OneToOneRelation>;
    
    const linkedOneToMany = Object.fromEntries(
      Object.entries(linked ?? {})
        .filter(([linkedItemKey, linkedItem]) => linkedItem.relation === 'oneToMany' && !hiddenLinkedItems?.includes(linkedItemKey))
    ) as Record<string, OneToManyRelation>;

    const linkedManyToMany = Object.fromEntries(
      Object.entries(linked ?? {})
        .filter(([linkedItemKey, linkedItem]) => linkedItem.relation === 'manyToMany' && !hiddenLinkedItems?.includes(linkedItemKey))
    ) as Record<string, ManyToManyRelation>;
    
    // Preload linked one-to-one records
    if (Object.keys(linkedOneToOne).length > 0) {
      const linkedRecordKeys: Record<string, any[]> = {};

      records.forEach(record => {
        Object.entries(linkedOneToOne).forEach(([, linkedItem]) => {
          const values = record[linkedItem.foreignKeyColumn];
          if (!values) {
            return;
          }

          if (!linkedRecordKeys[linkedItem.foreignKeyColumn]) {
            linkedRecordKeys[linkedItem.foreignKeyColumn] = [];
          }
          linkedRecordKeys[linkedItem.foreignKeyColumn].push(values);
        });
      });

      // Linked table records
      const linkedTableRecords: Record<string, any[]> = {};

      // Fetch the foreign tables records
      await Promise.all(Object.entries(linkedRecordKeys).map(async ([column, values]) => {
        const linkedItem = Object.values(linkedOneToOne)?.find(linked => linked.foreignKeyColumn === column);
        if (!linkedItem) {
          return;
        }

        const foreignRecords = await this
          .client(linkedItem.targetTable)
          .select(linkedItem.previewColumns ? [linkedItem.targetTableKeyColumn, ...linkedItem.previewColumns] : [linkedItem.targetTableKeyColumn])
          .whereIn(linkedItem.targetTableKeyColumn, values);

        // If excluded columns are provided, remove them from all records
        if (this.tablesConfig[linkedItem.targetTable]?.excludedColumns) {
          foreignRecords.forEach(record => {
            this.tablesConfig[linkedItem.targetTable].excludedColumns?.forEach(column => {
              delete record[column];
            });
          });
        }

        linkedTableRecords[linkedItem.targetTable] = foreignRecords;
      }));

      // Add linked records to the records
      records.forEach(record => {
        Object.keys(linkedRecordKeys).forEach((column) => {
          
          const linkedItemKey = Object.entries(linkedOneToOne).find(([, linkedItem]) => linkedItem.foreignKeyColumn === column)?.[0];
          if (!linkedItemKey) {
            return;
          }
          
          const linkedItem = linkedOneToOne?.[linkedItemKey];
          if (!linkedItem) {
            return;
          }

          const linkedRecords = linkedTableRecords[linkedItem.targetTable];
          if (!record['_linked']) {
            record['_linked'] = {};
          }
          if (!record['_linked'][linkedItemKey]) {
            (record['_linked'] as TableRpcResultSelectRecordLinkedDTO)[linkedItemKey] = {
              records: [],
            };
          }
          
          linkedRecords.map(linkedRecord => {
            if (linkedRecord[linkedItem.targetTableKeyColumn] === record[column]) {
              record['_linked'][linkedItemKey].records.push(linkedRecord);
            }
          });
          
        });
      });
    }

    // Preload linked one-to-many records
    if (Object.values(linkedOneToMany).length > 0 || Object.values(linkedManyToMany).length > 0) {
      await Promise.all(Object.entries({ ...linkedOneToMany, ...linkedManyToMany }).map(async ([linkedItemKey, linkedItem]) => {
        const foreignKeyValues = records.map(record => record[primaryKeyColumn!]);
        
        // TODO: replace with a single query
        const foreignTotalRecords: Record<string, number> = {};
        if (linkedItem.relation === 'oneToMany') {
          await Promise.all(
            foreignKeyValues.map(async keyValue => {
              const recordForeignRecords = await this.client(linkedItem.targetTable)
                .count({ count: '*' })
                .where(linkedItem.targetTableForeignKeyColumn, keyValue);

              foreignTotalRecords[keyValue] = recordForeignRecords[0]?.count ? Number(recordForeignRecords[0]?.count) : 0;
            })
          );
        }

        // TODO: replace with a single query
        if (linkedItem.relation === 'manyToMany') {
          await Promise.all(
            foreignKeyValues.map(async keyValue => {
              // Select the count of the records in the target table using the junction table
              const recordForeignRecords = await this.client(linkedItem.targetTable)
                .join(linkedItem.junctionTable, `${linkedItem.targetTable}.${linkedItem.targetTableKeyColumn}`, `${linkedItem.junctionTable}.${linkedItem.junctionTableTargetKeyColumn}`)
                .join(table!, `${linkedItem.junctionTable}.${linkedItem.junctionTableSourceKeyColumn}`, `${table}.${primaryKeyColumn}`)
                .where(`${table}.${primaryKeyColumn}`, keyValue)
                .count({ count: `${linkedItem.targetTable}.${linkedItem.targetTableKeyColumn}` });

              foreignTotalRecords[keyValue] = recordForeignRecords[0]?.count ? Number(recordForeignRecords[0]?.count) : 0;
            })
          );
        }

        // Add linked records to the records
        records.forEach(record => {
          if (!record['_linked']) {
            record['_linked'] = {};
          }
          if (!record['_linked'][linkedItemKey]) {
            (record['_linked'] as TableRpcResultSelectRecordLinkedDTO)[linkedItemKey] = {
              totalRecords: 0,
            };
          }

          // Loop through the foreign records and add them to the linked field
          record['_linked'][linkedItemKey].totalRecords = foreignTotalRecords[record[primaryKeyColumn!]] ?? 0;
        });
      }));
    }

    const preparedRecords = await this.prepareRecords(records, tableSchema);

    return {
      records: preparedRecords,
      totalRecords: Number(count),
    };
  };

  private async prepareRecords(records: any[], tableSchema: RelationalDatabaseSchemaTable): Promise<TableRpcResultSelectRecord[]> {
    const preparedRecords = await Promise.all(records.map(async record => {
      const preparedRecord: Record<string, any> = {
        _linked: record._linked,
      };

      // Process each property of the record except _linked
      await Promise.all(Object.entries(record).filter(([key]) => key !== '_linked').map(async ([key, value]) => {
        const columnSchema = tableSchema.columns.find(column => column.name === key);
        if (!columnSchema) {
          preparedRecord[key] = value;
        } else {
          try {
            preparedRecord[key] = await this.prepareRecordValue(value, columnSchema);
          } catch (e) {
            console.error('Error preparing record value:', e);
            preparedRecord[key] = value;
          }
        };
      }));

      return preparedRecord;
    }));

    return preparedRecords;
  }

  /**
   * Get the table record 
   * @description Used for one-to-one RecordSelect fields
   * @returns The table record
   */
  async getOneTableRecord(input: TableRpcInputSelectSingle, databaseSchema: RelationalDatabaseSchema): Promise<TableRpcResultSelectSingleDTO> {
    const { linkedItemKey, primaryKeyValues, forPreview, tableRpc } = input;
    const { linked, tableSchema, primaryKeyColumn: tableRpcPrimaryKeyColumn } = getTableData({ tableRpc, databaseSchema });
    if (!tableSchema) {
      throw new Error('Table schema not provided');
    }

    const linkedItem = linkedItemKey ? findLinkedItem(linkedItemKey, linked) : null;
    if ((linkedItemKey && !linkedItem) || (linkedItem && linkedItem.relation !== 'oneToOne') || !primaryKeyValues?.length) {
      throw new Error('Invalid primary key values or linked item key');
    }
    
    const columns = tableRpc.columns;
    const table = linkedItem ? linkedItem.targetTable : tableRpc.table;
    const primaryKeyColumn = linkedItem ? linkedItem.targetTableKeyColumn : tableRpcPrimaryKeyColumn;
    
    if (!table || !primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }

    if (this.tablesConfig[table]?.excluded) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }

    const query = this.client(table);

    // Select specific columns
    if (columns?.length && !forPreview) {
      const combinedColumns = columns.concat([primaryKeyColumn]) ?? [primaryKeyColumn];
      query.select(combinedColumns.map(column => `${table}.${column}`));
    } else {
      if (linkedItem && forPreview) {
        query.select([primaryKeyColumn, ...(linkedItem.previewColumns ?? [])].map(column => `${table}.${column}`));
      } else if (!columns) {
        // If no columns are specified, select all columns
        query.select('*');
      } else {
        query.select(primaryKeyColumn!);
      }
    }

    // Apply where conditions
    if (primaryKeyValues.length > 0) {
      query.where(primaryKeyColumn, primaryKeyValues[0]);
    }

    const record = await query.first();
    if (!record) {
      throw new Error('Record not found');
    }

    // If excluded columns are provided, remove them from the record
    if (this.tablesConfig[table]?.excludedColumns) {
      this.tablesConfig[table].excludedColumns.forEach(column => {
        delete record[column];
      });
    }

    const [preparedRecord] = await this.prepareRecords([record], tableSchema);
    
    return {
      record: preparedRecord,
    };
  };

  /**
   * Insert the table records (Table RPC)
   * @returns The table records
   */
  async insertTableRecord(input: TableRpcInputInsert, databaseSchema: RelationalDatabaseSchema): Promise<TableRpcResultInsertDTO> {
    const { tableRpc } = input;
    const { tableSchema, allowInsert, primaryKeyColumn } = getTableData({ tableRpc, databaseSchema });
    const table = tableRpc.table;

    if (!table || !primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }
    if (this.tablesConfig[table]?.excluded || this.tablesConfig[table]?.preventInsert) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }
    if (this.app.readOnlyMode) {
      throw new Error('Insert operation not permitted in read-only mode');
    }
    if (!allowInsert) {
      throw new Error('Insert operation not permitted on this table');
    }

    // Check if the record can be inserted
    if (tableRpc.canBeInserted && !tableRpc.canBeInserted(input.values)) {
      throw new Error('Record cannot be inserted');
    }

    // Pre-process the input values
    if (tableRpc.beforeInsert) {
      input.values = await tableRpc.beforeInsert(input.values);
    } else {
      for (const key in input.values) {
        const columnSchema = tableSchema?.columns.find(column => column.name === key);
        if (columnSchema) {
          input.values[key] = await this.prepareRecordValueBeforeUpsert(input.values[key], columnSchema);
        }
      }
    }

    await this.client(table).insert(input.values);

    return {};
  }

  /**
   * Update the table records (Table RPC)
   * @returns The table records
   */
  async updateTableRecords(input: TableRpcInputUpdate, databaseSchema: RelationalDatabaseSchema): Promise<TableRpcResultUpdateDTO> {
    const { tableRpc } = input;
    const { tableSchema, allowUpdate, primaryKeyColumn } = getTableData({ tableRpc, databaseSchema });
    const table = tableRpc.table;

    if (!table || !primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }
    if (this.tablesConfig[table]?.excluded || this.tablesConfig[table]?.preventUpdate) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }
    if (this.app.readOnlyMode) {
      throw new Error('Update operation not permitted in read-only mode');
    }
    if (!allowUpdate) {
      throw new Error('Update operation not permitted on this table');
    }

    // Check if the record can be updated
    if (tableRpc.canBeUpdated && !tableRpc.canBeUpdated(input.values)) {
      throw new Error('Record cannot be updated');
    }

    // Pre-process the input values
    if (tableRpc.beforeUpdate) {
      input.values = await tableRpc.beforeUpdate(input.values);
    } else {
      for (const key in input.values) {
        const columnSchema = tableSchema?.columns.find(column => column.name === key);
        if (columnSchema) {
          input.values[key] = await this.prepareRecordValueBeforeUpsert(input.values[key], columnSchema);
        }
      }
    }

    await this.client(table)
      .whereIn(primaryKeyColumn, input.primaryKeys)
      .update(input.values);

    return {};
  }

  /**
   * Delete the table records (Table RPC)
   * @returns The table records
   */
  async deleteTableRecords(input: TableRpcInputDelete, databaseSchema: RelationalDatabaseSchema): Promise<true> {
    const { tableRpc } = input;
    const { allowDelete, primaryKeyColumn } = getTableData({ tableRpc, databaseSchema });
    const table = tableRpc.table;

    if (!table || !primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }
    if (this.tablesConfig[table]?.excluded || this.tablesConfig[table]?.preventDelete) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }
    if (this.app.readOnlyMode) {
      throw new Error('Delete operation not permitted in read-only mode');
    }
    if (!allowDelete) {
      throw new Error('Delete operation not permitted on this table');
    }

    // Check if the record can be deleted
    if (tableRpc.canBeDeleted && !tableRpc.canBeDeleted(input.primaryKeys)) {
      throw new Error('Record cannot be deleted');
    }

    await this.client.table(table)
      .whereIn(primaryKeyColumn, input.primaryKeys)
      .del();

    return true;
  };

  /**
   * Connect to the database
   * @param reloadOnFailure - If true, will attempt to reconnect to the database on failure
   */
  connect(reloadOnFailure = true): void {
    // Set up a listener to attempt to reconnect to the database on failure
    if (reloadOnFailure) {
      this.client.client.pool.on('error', (err) => {
        console.error('Database connection error:', err);
  
        setTimeout(() => {
          console.log('Attempting to reconnect to the database...');
          this.connect();
        }, 3000);
      });
    }
  };

  /**
   * Ping the database to check if the connection is successful
   * @returns True if the connection is successful
   */
  public async pingDatabase(): Promise<boolean> {
    try {
      await this.client?.raw('SELECT 1');
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  /**
   * Destroy the database connection
   */
  public destroyConnection(): void {
    if (this.client) {
      this.client.destroy();
    }
  }
}

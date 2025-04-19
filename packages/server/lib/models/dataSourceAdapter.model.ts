import { Knex } from "knex";
import { DataSourceAdapterType, FieldInput, JsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn, RelationalDatabaseSchemaTable, TablePageInputDelete, TablePageInputInsert, TablePageInputSelect, TablePageInputUpdate, TablePageResultInsertDTO, TablePageResultSelectDTO, TablePageResultSelectRecord, TablePageResultUpdateDTO, TablePageResultSelectRecordLinkedDTO, defaultTablePageSize, TablePageInputSelectUsingExecuteQuery, TablePageInputSelectSingle, TablePageResultSelectSingleDTO, findRelationship, DataSourceTablesConfig, getTableData, TablePageConfig, FilterItem, OneToOneRelationship, OneToManyRelationship, ManyToManyRelationship } from "@kottster/common";
import { KottsterApp } from "../core/app";

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

  abstract getDatabaseTableCount(): Promise<number>;

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
    fieldInput: FieldInput;
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
  async getTableRecords(input: TablePageInputSelect, databaseSchema: RelationalDatabaseSchema, tablePageConfigDefault: TablePageConfig): Promise<TablePageResultSelectDTO> {
    const tablePageConfig = input.tablePageConfig ?? tablePageConfigDefault;
    const { 
      tableSchema, 
      tablePageProcessedConfig,
    } = getTableData({ tablePageConfig, databaseSchema });
    const executeQuery = tablePageConfig.executeQuery;
    const table = tablePageConfig.table;
    const limit = ((input.pageSize > 1000 ? 1000 : input.pageSize) || tablePageProcessedConfig.pageSize || defaultTablePageSize);

    // If a custom query is provided, execute it and return the result directly
    if (executeQuery) {
      return executeQuery(input as TablePageInputSelectUsingExecuteQuery);
    }

    if (!tableSchema) {
      throw new Error('Table schema not provided');
    }
    
    if (!table || !tablePageProcessedConfig.primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }

    if (this.tablesConfig[table]?.excluded) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }
    
    const query = this.client(table);
    const countQuery = this.client(table);

    // Selecting records by a specific foreign record
    if (input.getByForeignRecord) {
      const { relationship, recordPrimaryKeyValue } = input.getByForeignRecord;
      if (relationship.relation === 'oneToMany' && relationship.targetTableForeignKeyColumn) {
        query.where(relationship.targetTableForeignKeyColumn, recordPrimaryKeyValue);
        countQuery.where(relationship.targetTableForeignKeyColumn, recordPrimaryKeyValue);
      }
    }

    // Select specific columns
    if (tablePageProcessedConfig.selectableColumns && tablePageProcessedConfig.selectableColumns.length > 0) {
      if (tablePageProcessedConfig.primaryKeyColumn && !tablePageProcessedConfig.selectableColumns.includes(tablePageProcessedConfig.primaryKeyColumn)) {
        tablePageProcessedConfig.selectableColumns.push(tablePageProcessedConfig.primaryKeyColumn);
      }
      query.select(tablePageProcessedConfig.selectableColumns);
    } else {
      query.select('*');
    }
    countQuery.count({ count: '*' });

    // Apply search
    if (input.search) {
      const searchValue = input.search.trim();

      if (tablePageProcessedConfig.searchableColumns && tablePageProcessedConfig.searchableColumns.length > 0) {
        query.where(this.getSearchBuilder(tablePageProcessedConfig.searchableColumns, searchValue));
        countQuery.where(this.getSearchBuilder(tablePageProcessedConfig.searchableColumns, searchValue));
      }
    }

    // Apply ordering
    if (input.sorting) {
      if (tablePageProcessedConfig.sortableColumns && tablePageProcessedConfig.sortableColumns.includes(input.sorting.column)) {
        query.orderBy(input.sorting.column, input.sorting.direction);
      }
    } else {
      // By default, order by the primary key column
      query.orderBy(tablePageProcessedConfig.primaryKeyColumn, 'desc');
    }

    // Apply filters
    if (input.filters?.length) {
      query.where(this.getFilterBuilder(input.filters));
      countQuery.where(this.getFilterBuilder(input.filters));
    }

    // Apply pagination
    const offset = (input.page - 1) * limit;
    query
      .limit(limit)
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

    const oneToOneRelationships = (tablePageProcessedConfig.relationships?.filter(relationship => relationship.relation === 'oneToOne') ?? []) as OneToOneRelationship[]; 
    const oneToManyRelationships = (tablePageProcessedConfig.relationships?.filter(relationship => relationship.relation === 'oneToMany') ?? []) as OneToManyRelationship[];
    const manyToManyRelationships = (tablePageProcessedConfig.relationships?.filter(relationship => relationship.relation === 'manyToMany') ?? []) as ManyToManyRelationship[];
    
    // Preload linked one-to-one records
    if (oneToOneRelationships.length > 0) {
      const linkedRecordKeys: Record<string, any[]> = {};

      records.forEach(record => {
        oneToOneRelationships.forEach(relationship => {
          const values = relationship.foreignKeyColumn && record[relationship.foreignKeyColumn];
          if (!values || !relationship.foreignKeyColumn) {
            return;
          }

          if (!linkedRecordKeys[relationship.foreignKeyColumn]) {
            linkedRecordKeys[relationship.foreignKeyColumn] = [];
          }
          linkedRecordKeys[relationship.foreignKeyColumn].push(values);
        });
      });

      // Linked table records
      const linkedTableRecords: Record<string, any[]> = {};

      // Fetch the foreign tables records
      await Promise.all(Object.entries(linkedRecordKeys).map(async ([column, values]) => {
        const relationship = oneToOneRelationships?.find(linked => linked.foreignKeyColumn === column);
        if (!relationship || !relationship.targetTableKeyColumn || !relationship.targetTable) {
          return;
        }

        const tablePageConfigColumn = tablePageProcessedConfig.columns?.find(c => c.column === column);

        const foreignRecords = await this
          .client(relationship.targetTable)
          .select(tablePageConfigColumn?.relationshipPreviewColumns ? [relationship.targetTableKeyColumn, ...tablePageConfigColumn.relationshipPreviewColumns] : [relationship.targetTableKeyColumn])
          .whereIn(relationship.targetTableKeyColumn, values);

        // If excluded columns are provided, remove them from all records
        if (this.tablesConfig[relationship.targetTable]?.excludedColumns) {
          foreignRecords.forEach(record => {
            this.tablesConfig[relationship.targetTable!].excludedColumns?.forEach(column => {
              delete record[column];
            });
          });
        }

        linkedTableRecords[relationship.targetTable] = foreignRecords;
      }));

      // Add linked records to the records
      records.forEach(record => {
        Object.keys(linkedRecordKeys).forEach((column) => {
          const relationshipKey = oneToOneRelationships.find(relationship => relationship.foreignKeyColumn === column)?.key;
          if (!relationshipKey) {
            return;
          }
          
          const relationship = oneToOneRelationships?.find(relationship => relationship.key === relationshipKey);
          if (!relationship || !relationship.targetTable || !relationship.targetTableKeyColumn) {
            return;
          }

          const linkedRecords = linkedTableRecords[relationship.targetTable];
          if (!record['_related']) {
            record['_related'] = {};
          }
          if (!record['_related'][relationshipKey]) {
            (record['_related'] as TablePageResultSelectRecordLinkedDTO)[relationshipKey] = {
              records: [],
            };
          }
          
          linkedRecords.map(linkedRecord => {
            if (linkedRecord[relationship.targetTableKeyColumn!] === record[column]) {
              record['_related'][relationshipKey].records.push(linkedRecord);
            }
          });
          
        });
      });
    }

    // Preload linked one-to-many records
    if (oneToManyRelationships.length > 0 || manyToManyRelationships.length > 0) {
      await Promise.all([...oneToManyRelationships, ...manyToManyRelationships].map(async relationship => {
        const foreignKeyValues = records.map(record => record[tablePageProcessedConfig.primaryKeyColumn!]);
        
        // TODO: replace with a single query
        const foreignTotalRecords: Record<string, number> = {};
        if (relationship.relation === 'oneToMany' && relationship.targetTableForeignKeyColumn) {
          await Promise.all(
            foreignKeyValues.map(async keyValue => {
              const recordForeignRecords = await this.client(relationship.targetTable)
                .count({ count: '*' })
                .where(relationship.targetTableForeignKeyColumn!, keyValue);

              foreignTotalRecords[keyValue] = recordForeignRecords[0]?.count ? Number(recordForeignRecords[0]?.count) : 0;
            })
          );
        }

        // TODO: replace with a single query
        if (relationship.relation === 'manyToMany' && relationship.junctionTable) {
          await Promise.all(
            foreignKeyValues.map(async keyValue => {
              // Select the count of the records in the target table using the junction table
              const recordForeignRecords = await this.client(relationship.targetTable)
                .join(relationship.junctionTable!, `${relationship.targetTable}.${relationship.targetTableKeyColumn}`, `${relationship.junctionTable}.${relationship.junctionTableTargetKeyColumn}`)
                .join(table!, `${relationship.junctionTable}.${relationship.junctionTableSourceKeyColumn}`, `${table}.${tablePageProcessedConfig.primaryKeyColumn}`)
                .where(`${table}.${tablePageProcessedConfig.primaryKeyColumn}`, keyValue)
                .count({ count: `${relationship.targetTable}.${relationship.targetTableKeyColumn}` });

              foreignTotalRecords[keyValue] = recordForeignRecords[0]?.count ? Number(recordForeignRecords[0]?.count) : 0;
            })
          );
        }

        // Add linked records to the records
        records.forEach(record => {
          if (!record['_related']) {
            record['_related'] = {};
          }
          if (!record['_related'][relationship.key]) {
            (record['_related'] as TablePageResultSelectRecordLinkedDTO)[relationship.key] = {
              totalRecords: 0,
            };
          }

          // Loop through the foreign records and add them to the linked field
          record['_related'][relationship.key].totalRecords = foreignTotalRecords[record[tablePageProcessedConfig.primaryKeyColumn!]] ?? 0;
        });
      }));
    }

    const preparedRecords = await this.prepareRecords(records, tableSchema);

    return {
      records: preparedRecords,
      totalRecords: Number(count),
    };
  };

  private async prepareRecords(records: any[], tableSchema: RelationalDatabaseSchemaTable): Promise<TablePageResultSelectRecord[]> {
    const preparedRecords = await Promise.all(records.map(async record => {
      const preparedRecord: Record<string, any> = {
        _related: record._related,
      };

      // Process each property of the record except _related
      await Promise.all(Object.entries(record).filter(([key]) => key !== '_related').map(async ([key, value]) => {
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
  async getOneTableRecord(input: TablePageInputSelectSingle, databaseSchema: RelationalDatabaseSchema): Promise<TablePageResultSelectSingleDTO> {
    const { relationshipKey, primaryKeyValues, forPreview, tablePageConfig } = input;
    const { 
      tableSchema,
      tablePageProcessedConfig: {
        relationships, 
        primaryKeyColumn: tablePagePrimaryKeyColumn, 
        columns 
      }
    } = getTableData({ tablePageConfig, databaseSchema });
    if (!tableSchema) {
      throw new Error('Table schema not provided');
    }

    const relationship = relationshipKey ? findRelationship(relationshipKey, relationships) : null;
    if ((relationshipKey && !relationship) || (relationship && relationship.relation !== 'oneToOne') || !primaryKeyValues?.length) {
      throw new Error('Invalid primary key values or relationship key');
    }
    
    const selectableColumns = columns?.map(c => c.column) ?? [];
    const table = relationship ? relationship.targetTable : tablePageConfig.table;
    const primaryKeyColumn = relationship ? relationship.targetTableKeyColumn : tablePagePrimaryKeyColumn;

    const tablePageConfigColumn = columns?.find(c => c.column === relationship?.foreignKeyColumn);
    
    if (!table || !primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }

    if (this.tablesConfig[table]?.excluded) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }

    const query = this.client(table);

    // Select specific columns
    if (columns?.length && !forPreview) {
      const combinedColumns = selectableColumns.concat([primaryKeyColumn]) ?? [primaryKeyColumn];
      query.select(combinedColumns.map(column => `${table}.${column}`));
    } else {
      if (relationship && forPreview) {
        query.select([primaryKeyColumn, ...(tablePageConfigColumn?.relationshipPreviewColumns ?? [])].map(column => `${table}.${column}`));
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
  async insertTableRecord(input: TablePageInputInsert, databaseSchema: RelationalDatabaseSchema): Promise<TablePageResultInsertDTO> {
    const { tablePageConfig } = input;
    const { 
      tableSchema, 
      tablePageProcessedConfig,
    } = getTableData({ tablePageConfig, databaseSchema });
    const table = tablePageConfig.table;

    if (!table || !tablePageProcessedConfig.primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }
    if (this.tablesConfig[table]?.excluded || this.tablesConfig[table]?.preventInsert) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }
    if (this.app.readOnlyMode) {
      throw new Error('Insert operation not permitted in read-only mode');
    }
    if (!tablePageProcessedConfig.allowInsert) {
      throw new Error('Insert operation not permitted on this table');
    }

    // Check if the record can be inserted
    if (tablePageConfig.canBeInserted && !tablePageConfig.canBeInserted(input.values)) {
      throw new Error('Record cannot be inserted');
    }

    // Pre-process the input values
    let values: Record<string, any> = {};
    if (tablePageConfig.beforeInsert) {
      values = await tablePageConfig.beforeInsert(input.values);
    } else {
      for (const key in input.values) {
        const columnSchema = tableSchema?.columns.find(column => column.name === key);
        if (columnSchema) {
          values[key] = await this.prepareRecordValueBeforeUpsert(input.values[key], columnSchema);
        }
      }
    }

    await this.client(table).insert(values);

    return {};
  }

  /**
   * Update the table records (Table RPC)
   * @returns The table records
   */
  async updateTableRecords(input: TablePageInputUpdate, databaseSchema: RelationalDatabaseSchema): Promise<TablePageResultUpdateDTO> {
    const { tablePageConfig } = input;
    const { 
      tableSchema, 
      tablePageProcessedConfig 
    } = getTableData({ tablePageConfig, databaseSchema });
    const table = tablePageConfig.table;

    if (!table || !tablePageProcessedConfig.primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }
    if (this.tablesConfig[table]?.excluded || this.tablesConfig[table]?.preventUpdate) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }
    if (this.app.readOnlyMode) {
      throw new Error('Update operation not permitted in read-only mode');
    }
    if (!tablePageProcessedConfig.allowUpdate) {
      throw new Error('Update operation not permitted on this table');
    }

    // Check if the record can be updated
    if (tablePageConfig.canBeUpdated && !tablePageConfig.canBeUpdated(input.values)) {
      throw new Error('Record cannot be updated');
    }

    // Pre-process the input values
    let values: Record<string, any> = {};
    if (tablePageConfig.beforeUpdate) {
      values = await tablePageConfig.beforeUpdate(input.values);
    } else {
      for (const key in input.values) {
        const columnSchema = tableSchema?.columns.find(column => column.name === key);
        if (columnSchema) {
          values[key] = await this.prepareRecordValueBeforeUpsert(input.values[key], columnSchema);
        }
      }
    }

    await this.client(table)
      .whereIn(tablePageProcessedConfig.primaryKeyColumn, input.primaryKeys)
      .update(values);

    return {};
  }

  /**
   * Delete the table records (Table RPC)
   * @returns The table records
   */
  async deleteTableRecords(input: TablePageInputDelete, databaseSchema: RelationalDatabaseSchema): Promise<true> {
    const { tablePageConfig } = input;
    const { tablePageProcessedConfig } = getTableData({ tablePageConfig, databaseSchema });
    const table = tablePageConfig.table;

    if (!table || !tablePageProcessedConfig.primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }
    if (this.tablesConfig[table]?.excluded || this.tablesConfig[table]?.preventDelete) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }
    if (this.app.readOnlyMode) {
      throw new Error('Delete operation not permitted in read-only mode');
    }
    if (!tablePageProcessedConfig.allowDelete) {
      throw new Error('Delete operation not permitted on this table');
    }

    // Check if the record can be deleted
    if (tablePageConfig.canBeDeleted && !tablePageConfig.canBeDeleted(input.primaryKeys)) {
      throw new Error('Record cannot be deleted');
    }

    await this.client.table(table)
      .whereIn(tablePageProcessedConfig.primaryKeyColumn, input.primaryKeys)
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

import { Knex } from "knex";
import { DataSourceAdapterType, FieldInput, JsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn, RelationalDatabaseSchemaTable, TablePageDeleteRecordInput, TablePageCreateRecordInput, TablePageGetRecordsInput, TablePageUpdateRecordInput, TablePageCreateRecordResult, TablePageGetRecordsResult, TablePageRecord, TablePageUpdateRecordResult, TablePageRecordRelated, defaultTablePageSize, TablePageGetRecordInput, TablePageGetRecordResult, DataSourceTablesConfig, getTableData, TablePageConfig, FilterItem, OneToOneRelationship, OneToManyRelationship, ManyToManyRelationship, Stage, DataSource, DashboardPageGetStatDataInput, DashboardPageGetStatDataResult, DashboardPageConfigStat, DashboardPageConfigCard, DashboardPageGetCardDataResult, DashboardPageGetCardDataInput, getNestedTablePageConfigByTablePageNestedTableKey } from "@kottster/common";
import { KottsterApp } from "../core/app";
import { CachingService } from "../services/caching.service";

/**
 * The base class for all data source adapters
 * @abstract
 */
export abstract class DataSourceAdapter {
  abstract type: DataSourceAdapterType;
  protected databaseSchemas: string[] = [];
  private app: KottsterApp;
  private tablesConfig: DataSourceTablesConfig;
  private cachedFullDatabaseSchemaSchema: RelationalDatabaseSchema | null = null;
  private cachingService = new CachingService();
  protected name: string;

  constructor(protected client: Knex) {}

  /**
   * Set the app instance
   */
  public setApp(app: KottsterApp): void {
    this.app = app;
  }

  /**
   * Set the data source data
   */
  public setData(data: Omit<DataSource, 'databaseSchema'>): void {
    this.name = data.name;
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
    const slug = `datasource_${this.name}_schema`;
    
    if (this.app.stage === Stage.development) {
      this.cachedFullDatabaseSchemaSchema = this.cachingService.readValueFromCache(slug) as RelationalDatabaseSchema | null;
    }
  
    if (this.cachedFullDatabaseSchemaSchema) {
      databaseSchema = this.cachedFullDatabaseSchemaSchema;
    } else {
      databaseSchema = await this.getDatabaseSchemaRaw();
      
      // Save the full database schema in the cache
      this.cachedFullDatabaseSchemaSchema = this.removeExcludedTablesAndColumns(databaseSchema);
      if (this.app.stage === Stage.development) {
        this.cachingService.saveValueToCache(slug, this.cachedFullDatabaseSchemaSchema);
      }

      console.log(`Database schema for "${this.name}" cached`);

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
   * Get the stat data (Dashboard RPC)
   * @returns The stat data
   */
  async getStatData(input: DashboardPageGetStatDataInput, stat: DashboardPageConfigStat): Promise<DashboardPageGetStatDataResult> {
    const value = await this.executeRawQueryForSingleValue(stat.sqlQuery, {
      period_start_date: input.periodStartDate,
      period_end_date: input.periodEndDate,
    });
    const total = stat.type === 'ratio' && stat.sqlTotalQuery ? await this.executeRawQueryForSingleValue(stat.sqlTotalQuery, {
      period_start_date: input.periodStartDate,
      period_end_date: input.periodEndDate,
    }) : undefined;
    
    return {
      value: value !== undefined ? value : undefined,
      total: total !== undefined ? total : undefined,
    }
  }

  /**
   * Get the card data (Dashboard RPC)
   * @returns The card data
   */
  async getCardData(input: DashboardPageGetCardDataInput, card: DashboardPageConfigCard): Promise<DashboardPageGetCardDataResult> {
    const items = await this.executeRawQuery(card.sqlQuery, {
      period_start_date: input.periodStartDate,
      period_end_date: input.periodEndDate,
    });

    return {
      items: items !== undefined ? items : [],
    }
  }

  /**
   * Get the table records (Table RPC)
   * @returns The table records
   */
  async getTableRecords(rootTablePageConfig: TablePageConfig, input: TablePageGetRecordsInput, databaseSchema: RelationalDatabaseSchema): Promise<TablePageGetRecordsResult> {
    const tablePageConfig = !input.nestedTableKey ? rootTablePageConfig : getNestedTablePageConfigByTablePageNestedTableKey(rootTablePageConfig, input.nestedTableKey);

    const { 
      tableSchema, 
      tablePageProcessedConfig,
    } = getTableData({ tablePageConfig, databaseSchema });
    
    const customSqlQuery = tablePageConfig.customSqlQuery;
    const customSqlCountQuery = tablePageConfig.customSqlCountQuery;

    const table = tablePageConfig.table;
    const limit = ((input.pageSize > 1000 ? 1000 : input.pageSize) || tablePageProcessedConfig.pageSize || defaultTablePageSize);
    const knexQueryModifier = tablePageConfig.knexQueryModifier as ((knex: Knex.QueryBuilder) => Knex.QueryBuilder) | undefined;

    // If a custom SQL query is provided, execute it and return the result directly
    if (customSqlQuery) {
      const records = await this.executeRawQuery(customSqlQuery, {
        offset: (input.page - 1) * limit,
        limit: input.pageSize,
      });
      const total = customSqlCountQuery ? await this.executeRawQueryForSingleValue(customSqlCountQuery, {}) : undefined;

      return {
        records: records as TablePageRecord[],
        total: total !== undefined ? Number(total) : undefined,
      };
    }
    
    if (!table || !tablePageProcessedConfig.primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }

    if (this.tablesConfig[table]?.excluded) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }

    const tableAlias = 'main';
    let query = this.client(table).from({ [tableAlias]: table });
    let countQuery = this.client(table).from({ [tableAlias]: table });

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

    // Add calculated columns to the select statement
    if (tablePageConfig.calculatedColumns) {
      tablePageConfig.calculatedColumns.forEach(calculatedColumn => {
        query.select(this.client.raw(`(${calculatedColumn.sqlExpression}) as "${calculatedColumn.alias}"`));
      });
    }

    // Apply search
    if (input.search) {
      const searchValue = input.search.trim();

      if (tablePageProcessedConfig.searchableColumns && tablePageProcessedConfig.searchableColumns.length > 0) {
        query.where(this.getSearchBuilder(tablePageProcessedConfig.searchableColumns, searchValue));
        countQuery.where(this.getSearchBuilder(tablePageProcessedConfig.searchableColumns, searchValue));
      }
    }

    // Apply sorting
    if (input.sorting) {
      if (tablePageProcessedConfig.sortableColumns && tablePageProcessedConfig.sortableColumns.includes(input.sorting.column)) {
        query.orderBy(input.sorting.column, input.sorting.direction);
      }
    } else if (tablePageProcessedConfig.defaultSortColumn && tablePageProcessedConfig.defaultSortDirection) {
      query.orderBy(
        tablePageProcessedConfig.defaultSortColumn, 
        tablePageProcessedConfig.defaultSortDirection
      );
    }

    // Apply filters
    if (input.filters?.length) {
      query.where(this.getFilterBuilder(input.filters));
      countQuery.where(this.getFilterBuilder(input.filters));
    }

    // Apply Knex query modifier
    if (knexQueryModifier) {
      query = knexQueryModifier(query);
      countQuery = knexQueryModifier(countQuery);
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

    await this.enrichRecordsWithRelatedData(records, tablePageProcessedConfig);

    const preparedRecords = tableSchema ? await this.prepareRecords(records, tableSchema) : records;

    return {
      records: preparedRecords,
      total: Number(count),
    };
  };

  /**
   * Enrich the records with related data for visible relationships in the table
   * @returns The enriched records
   */
  private async enrichRecordsWithRelatedData(records: TablePageRecord[], tablePageProcessedConfig: TablePageConfig, forForm?: boolean): Promise<TablePageRecord[]> {
    // Collect all relationships that are visible in the table
    const visibleRelationships = tablePageProcessedConfig.relationships?.filter(r => forForm ? true : !r.hiddenInTable) ?? [];
    const oneToOneRelationships = (visibleRelationships.filter(r => r.relation === 'oneToOne') ?? []) as OneToOneRelationship[];
    const oneToManyRelationships = (visibleRelationships.filter(r => r.relation === 'oneToMany') ?? []) as OneToManyRelationship[];
    const manyToManyRelationships = (visibleRelationships.filter(r => r.relation === 'manyToMany') ?? []) as ManyToManyRelationship[];
    
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
            (record['_related'] as TablePageRecordRelated)[relationshipKey] = {
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
                .join(tablePageProcessedConfig.table!, `${relationship.junctionTable}.${relationship.junctionTableSourceKeyColumn}`, `${tablePageProcessedConfig.table}.${tablePageProcessedConfig.primaryKeyColumn}`)
                .where(`${tablePageProcessedConfig.table}.${tablePageProcessedConfig.primaryKeyColumn}`, keyValue)
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
            (record['_related'] as TablePageRecordRelated)[relationship.key] = {
              total: 0,
            };
          }

          // Loop through the foreign records and add them to the linked field
          record['_related'][relationship.key].total = foreignTotalRecords[record[tablePageProcessedConfig.primaryKeyColumn!]] ?? 0;
        });
      }));
    }
    
    return records;
  }

  private async prepareRecords(records: any[], tableSchema: RelationalDatabaseSchemaTable): Promise<TablePageRecord[]> {
    const preparedRecords = await Promise.all(records.map(async record => {
      const preparedRecord: Record<string, any> = {
        _related: record._related,
      };

      // Process each property of the record except _related
      await Promise.all(Object.entries(record).filter(([key]) => key !== '_related').map(async ([key, value]) => {
        const columnSchema = tableSchema.columns.find(column => column.name === key);
        if (record.id === 1140 && key === 'created_at') {
          console.debug('Returned created_at', record.created_at, record.created_at instanceof Date ? record.created_at.toISOString() : undefined);
        };
        
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

  async executeRawQueryForSingleValue(query: string, vars: Record<string, any> = {}): Promise<string | undefined> {
    const result = await this.executeRawQuery(query, vars);

    let final: number | undefined = undefined;
    if (result?.[0]?.count) {
      final = result[0].count;
    }
    if (result?.[0][Object.keys(result[0])[0]]) {
      final = result[0][Object.keys(result[0])[0]];
    }

    return final ? `${final}` : '0';
  }

  async executeRawQuery(query: string, vars: Record<string, any> = {}): Promise<any[]> {
    switch (this.type) {
      case DataSourceAdapterType.knex_pg: {
        const { rows: records } = await this.client.raw(query, vars);

        return records;
      };
      case DataSourceAdapterType.knex_mysql2: {
        const [records] = await this.client.raw(query, vars);

        return records;
      };
      case DataSourceAdapterType.knex_better_sqlite3: {
        const records = await this.client.raw(query, vars);

        return records;
      };
      case DataSourceAdapterType.knex_tedious: {
        const records = await this.client.raw(query, vars);

        return records;
      };
      default: {
        throw new Error(`Unsupported data source adapter type: ${this.type}`);
      }
    }
  }

  /**
   * Get the table record 
   * @description Used for one-to-one RecordSelect fields
   * @returns The table record
   */
  async getOneTableRecord(rootTablePageConfig: TablePageConfig, input: TablePageGetRecordInput, databaseSchema: RelationalDatabaseSchema): Promise<TablePageGetRecordResult> {
    const { primaryKeyValues, forPreview } = input;
    const tablePageConfig = !input.nestedTableKey ? rootTablePageConfig : getNestedTablePageConfigByTablePageNestedTableKey(rootTablePageConfig, input.nestedTableKey);

    const { 
      tableSchema,
      tablePageProcessedConfig
    } = getTableData({ tablePageConfig, databaseSchema });
    if (!tableSchema) {
      throw new Error('Table schema not provided');
    }
    const { columns, primaryKeyColumn: tablePagePrimaryKeyColumn } = tablePageProcessedConfig;

    if (!primaryKeyValues || primaryKeyValues.length === 0) {
      throw new Error('No primary key values provided');
    }
    
    const selectableColumns = columns?.map(c => c.column) ?? [];
    const table = tablePageConfig.table;
    const primaryKeyColumn = tablePagePrimaryKeyColumn;
    
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
      if (forPreview) {
        const rootConfigAsParentConfig = !input.nestedTableKey || input.nestedTableKey.length < 2;
        const parentTablePageConfig = rootConfigAsParentConfig ? rootTablePageConfig : getNestedTablePageConfigByTablePageNestedTableKey(rootTablePageConfig, input.nestedTableKey!.slice(0, -1)!);
        const parentTablePageProcessedConfig = getTableData({ tablePageConfig: parentTablePageConfig, databaseSchema }).tablePageProcessedConfig;
        const columnConfig = parentTablePageProcessedConfig.columns?.find(c => c.column === input.nestedTableKey?.[input.nestedTableKey.length - 1]?.parentForeignKey);
        query.select([primaryKeyColumn, ...(columnConfig?.relationshipPreviewColumns ?? [])].map(column => `${table}.${column}`));
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

    if (!forPreview) {
      await this.enrichRecordsWithRelatedData([record], tablePageProcessedConfig);
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
  async insertTableRecord(rootTablePageConfig: TablePageConfig, input: TablePageCreateRecordInput, databaseSchema: RelationalDatabaseSchema): Promise<TablePageCreateRecordResult> {
    const tablePageConfig = !input.nestedTableKey ? rootTablePageConfig : getNestedTablePageConfigByTablePageNestedTableKey(rootTablePageConfig, input.nestedTableKey);

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

    // Pre-process the input values
    let values: Record<string, any> = {};
    for (const key in input.values) {
      const columnSchema = tableSchema?.columns.find(column => column.name === key);
      if (columnSchema) {
        values[key] = await this.prepareRecordValueBeforeUpsert(input.values[key], columnSchema);
      }
    }

    // Check if the record can be inserted
    if (tablePageConfig.validateRecordBeforeInsert && !await tablePageConfig.validateRecordBeforeInsert(values)) {
      throw new Error('Record cannot be inserted');
    }

    if (tablePageConfig.transformRecordBeforeInsert) {
      // Transform the values before inserting
      values = await tablePageConfig.transformRecordBeforeInsert(values);
    }

    const primaryKey = await this.executeUpsertAndGetId(
      this.client(table).insert(values),
      tablePageProcessedConfig.primaryKeyColumn
    );

    if (primaryKey && tablePageConfig.afterInsert) {
      await tablePageConfig.afterInsert(primaryKey, values);
    }

    return {};
  }

  /**
   * Update the table records (Table RPC)
   * @returns The table records
   */
  async updateTableRecords(rootTablePageConfig: TablePageConfig, input: TablePageUpdateRecordInput, databaseSchema: RelationalDatabaseSchema): Promise<TablePageUpdateRecordResult> {
    const tablePageConfig = !input.nestedTableKey ? rootTablePageConfig : getNestedTablePageConfigByTablePageNestedTableKey(rootTablePageConfig, input.nestedTableKey);

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

    // Pre-process the input values
    let values: Record<string, any> = {};
    for (const key in input.values) {
      const columnSchema = tableSchema?.columns.find(column => column.name === key);
      if (columnSchema) {
        values[key] = await this.prepareRecordValueBeforeUpsert(input.values[key], columnSchema);
      }
    }

    // Check if the record can be updated
    if (tablePageConfig.validateRecordBeforeUpdate && !await tablePageConfig.validateRecordBeforeUpdate(input.primaryKeyValue, values)) {
      throw new Error('Record cannot be updated');
    }

    if (tablePageConfig.transformRecordBeforeUpdate) {
      // Transform the values before updating
      values = await tablePageConfig.transformRecordBeforeUpdate(input.primaryKeyValue, values);
    }

    await this.client(table)
      .where(tablePageProcessedConfig.primaryKeyColumn, input.primaryKeyValue)
      .update(values);

    if (tablePageConfig.afterUpdate) {
      await tablePageConfig.afterUpdate(input.primaryKeyValue, values);
    }

    return {};
  }

  private async executeUpsertAndGetId(query: Knex.QueryBuilder, primaryKeyColumn: string): Promise<any> {
  // For MySQL, we use a different approach to get the inserted ID
  if (this.type === DataSourceAdapterType.knex_mysql2) {
    const result = await query;
    return result[0];
  } else {
    return await query.returning(primaryKeyColumn);
  }
}

  /**
   * Delete the table records (Table RPC)
   * @returns The table records
   */
  async deleteTableRecords(rootTablePageConfig: TablePageConfig, input: TablePageDeleteRecordInput, databaseSchema: RelationalDatabaseSchema): Promise<true> {
    const tablePageConfig = !input.nestedTableKey ? rootTablePageConfig : getNestedTablePageConfigByTablePageNestedTableKey(rootTablePageConfig, input.nestedTableKey);

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

    // Check if the records can be deleted
    if (tablePageConfig.validateRecordBeforeDelete) {
      // Check every primary key value
      for (const primaryKey of input.primaryKeyValues) {
        if (!await tablePageConfig.validateRecordBeforeDelete(primaryKey)) {
          throw new Error(`Record #${primaryKey} cannot be deleted`);
        }
      }
    }

    await this.client.table(table)
      .whereIn(tablePageProcessedConfig.primaryKeyColumn, input.primaryKeyValues)
      .del();

    if (tablePageConfig.afterDelete) {
      // Call afterDelete for each primary key
      for (const primaryKey of input.primaryKeyValues) {
        await tablePageConfig.afterDelete(primaryKey);
      }
    }

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

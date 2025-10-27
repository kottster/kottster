import { Knex } from "knex";
import { DataSourceAdapterType, FieldInput, JsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn, RelationalDatabaseSchemaTable, TablePageDeleteRecordInput, TablePageCreateRecordInput, TablePageGetRecordsInput, TablePageUpdateRecordInput, TablePageCreateRecordResult, TablePageGetRecordsResult, TablePageRecord, TablePageUpdateRecordResult, TablePageRecordRelated, defaultTablePageSize, TablePageGetRecordInput, TablePageGetRecordResult, DataSourceTablesConfig, getTableData, TablePageConfig, FilterItem, OneToOneRelationship, OneToManyRelationship, Stage, DataSource, DashboardPageGetStatDataInput, DashboardPageGetStatDataResult, DashboardPageConfigStat, DashboardPageConfigCard, DashboardPageGetCardDataResult, DashboardPageGetCardDataInput, getNestedTablePageConfigByTablePageNestedTableKey, findNameLikeColumns, getNestedTablePageConfigByTablePageNestedTableKeyAndVerify } from "@kottster/common";
import { KottsterApp } from "../core/app";
import { CachingService } from "../services/caching.service";
import { Readable } from "stream";

/**
 * The base class for all data source adapters
 * @abstract
 */
export abstract class DataSourceAdapter {
  abstract type: DataSourceAdapterType;
  protected databaseSchemas: string[] = [];
  private app?: KottsterApp;
  private tablesConfig: DataSourceTablesConfig;
  private cachedFullDatabaseSchemaSchema: RelationalDatabaseSchema | null = null;
  private cachingService = new CachingService();
  protected name: string;
  
  // Chunk size for streaming
  private readonly STREAM_CHUNK_SIZE: number = 50;

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

  public checkIfAnyTableHasPrimaryKey(schema: RelationalDatabaseSchema): boolean {
    return schema.tables.some(table => table.columns.some(column => column.primaryKey));
  }

  abstract getDatabaseTableCount(): Promise<number>;

  abstract getDatabaseSchemaRaw(): Promise<RelationalDatabaseSchema>;

  private sortColumnsByPriority(columns: RelationalDatabaseSchemaColumn[]): RelationalDatabaseSchemaColumn[] {
    // Get all name-like columns sorted by likeness (not just the first one)
    const nameLikeColumnsSorted = findNameLikeColumns(columns, columns.length);
    
    // Sort by column priority
    const sortedColumns = [...columns].sort((a, b) => {
      const getPriority = (column: RelationalDatabaseSchemaColumn): number => {
        if (column.primaryKey) {
          return 1;
        }

        // Check if it's a name-like column
        const nameIndex = nameLikeColumnsSorted.indexOf(column.name);
        if (nameIndex !== -1) {
          // Use 2.x to maintain name-like columns in priority 2 range
          // but ordered by their likeness (2.0, 2.1, 2.2, etc.)
          return 2 + (nameIndex * 0.001);
        }

        if (column.foreignKey) {
          return 6;
        }

        if (column.contentHint === 'string') {
          return 3;
        }

        if (column.contentHint === 'number' || column.contentHint === 'boolean') {
          return 4;
        }

        if (column.contentHint === 'date') {
          return 5;
        }

        return 7;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.name.localeCompare(b.name);
    });
    
    return sortedColumns.filter(c => !!c);
  }
  
  /**
   * Get the database schema
   * @returns The database schema
   */
  async getDatabaseSchema(): Promise<RelationalDatabaseSchema> {
    let databaseSchema: RelationalDatabaseSchema;
    const slug = `datasource_${this.name}_schema`;
    
    if (this.app?.stage === Stage.development) {
      this.cachedFullDatabaseSchemaSchema = this.cachingService.readValueFromCache(slug) as RelationalDatabaseSchema | null;
    }
  
    if (this.cachedFullDatabaseSchemaSchema) {
      databaseSchema = this.cachedFullDatabaseSchemaSchema;
    } else {
      databaseSchema = await this.getDatabaseSchemaRaw();

      // Sort table by name
      databaseSchema.tables.sort((a, b) => a.name.localeCompare(b.name));

      // Sort columns by priority within each table
      databaseSchema.tables.forEach(table => {
        table.columns = this.sortColumnsByPriority(table.columns);
      });

      // Ensure that the cached schema still hasn't been set while we were fetching the schema
      if (!this.cachedFullDatabaseSchemaSchema) {
        // Save the full database schema in the cache
        this.cachedFullDatabaseSchemaSchema = this.removeExcludedTablesAndColumns(databaseSchema);
        if (this.app?.stage === Stage.development) {
          this.cachingService.saveValueToCache(slug, this.cachedFullDatabaseSchemaSchema);
        }
  
        console.log(`Database schema for "${this.name}" cached`);
      }

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
   * Apply the filters to the query
   */
  applyFilters(
    query: Knex.QueryBuilder,
    filterItems: FilterItem[],
    mainTable: string,
    databaseSchema: RelationalDatabaseSchema
  ) {
    const joinsAdded = new Set<string>();
    
    const mainTableSchema = databaseSchema.tables.find(t => t.name === mainTable);
    if (!mainTableSchema) {
      throw new Error(`Table schema not found for table: ${mainTable}`);
    };

    filterItems.forEach(filterItem => {
      const nestedTableKeyItem = filterItem.nestedTableKey?.[0];

      // TODO: Make so that joins set were containing 
      // not just table names, but also the join conditions.
      // It would prevent duplicate joins in more complex scenarios
      
      if (nestedTableKeyItem?.childForeignKey) {
        const mainTableForeignKeyColumn = mainTableSchema.columns.find(
          col => col.name === nestedTableKeyItem.childForeignKey && 
                col.foreignKey?.table === nestedTableKeyItem.table
        );
  
        // Handle joins for filters on related tables
        if (!joinsAdded.has(mainTableForeignKeyColumn?.foreignKey?.table!)) {
          query.join(
            mainTableForeignKeyColumn?.foreignKey?.table!,
            `main.${nestedTableKeyItem.childForeignKey}`,
            `${mainTableForeignKeyColumn?.foreignKey?.table}.${mainTableForeignKeyColumn?.foreignKey?.column}`
          );
          joinsAdded.add(nestedTableKeyItem?.table!);
        }
      } else if (nestedTableKeyItem?.parentForeignKey) {
        const foreignTableSchema = databaseSchema.tables.find(t => t.name === nestedTableKeyItem.table);
        const foreignTableForeignKeyColumn = foreignTableSchema?.columns.find(
          col => col.name === nestedTableKeyItem.parentForeignKey && 
                col.foreignKey?.table === mainTable
        );

        if (!joinsAdded.has(foreignTableForeignKeyColumn?.foreignKey?.table!)) {
          query.join(
            foreignTableSchema?.name!, 
            `main.${foreignTableForeignKeyColumn?.foreignKey?.column}`, 
            `${foreignTableSchema?.name!}.${foreignTableForeignKeyColumn?.name}`
          )
          joinsAdded.add(nestedTableKeyItem?.table!);
        }
      }

      if (nestedTableKeyItem) {
        this.applyFilterCondition(query, filterItem, `${nestedTableKeyItem?.table}.${filterItem.column}`);
      } else {
        this.applyFilterCondition(query, filterItem, `main.${filterItem.column}`);
      }
    });
  }

  abstract applyFilterCondition(
    builder: Knex.QueryBuilder,
    filterItem: FilterItem,
    columnReference: string,
  ): void;

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
   * Build the base query for table records
   */
  private buildTableRecordsQuery(
    rootTablePageConfig: TablePageConfig,
    input: TablePageGetRecordsInput,
    databaseSchema: RelationalDatabaseSchema,
    options: { includeCount?: boolean } = {}
  ) {
    const tablePageConfig = !input.nestedTableKey 
      ? rootTablePageConfig 
      : getNestedTablePageConfigByTablePageNestedTableKeyAndVerify(rootTablePageConfig, input.nestedTableKey, databaseSchema);

    const { 
      tableSchema, 
      tablePageProcessedConfig,
    } = getTableData({ tablePageConfig, databaseSchema });
    if (!tableSchema) {
      throw new Error(`Table schema for "${tablePageConfig.table}" not found`);
    }
    
    const table = tablePageConfig.table;
    const knexQueryModifier = tablePageConfig.knexQueryModifier;

    if (!table || !tablePageProcessedConfig.primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }

    if (this.tablesConfig[table]?.excluded) {
      throw new Error(`Access to the table "${table}" is restricted`);
    }

    const tableAlias = 'main';
    let query = this.client(table).from({ [tableAlias]: table });
    let countQuery = options.includeCount ? this.client(table).from({ [tableAlias]: table }) : null;

    // Filter by view
    if (input.viewKey) {
      const view = tablePageConfig.views?.find(v => v.key === input.viewKey);
      if (view) {
        if (view.filteringStrategy === 'filter') {
          if (!view.filterItems || view.filterItems.length === 0) {
            throw new Error('Filter items not provided for the selected view');
          }
          this.applyFilters(query, view.filterItems, tableSchema.name, databaseSchema);
          if (countQuery) {
            this.applyFilters(countQuery, view.filterItems, tableSchema.name, databaseSchema);
          }
        }
        if (view.filteringStrategy === 'sqlWhereExpression') {
          if (!view.sqlWhereExpression) {
            throw new Error('SQL expression WHERE clause not provided for the selected view');
          }
          query.whereRaw(`(${view.sqlWhereExpression})`);
          countQuery?.whereRaw(`(${view.sqlWhereExpression})`);
        }
      }
    }

    // Foreign record filter
    if (input.getByForeignRecord) {
      const { relationship, recordPrimaryKeyValue } = input.getByForeignRecord;
      if (relationship.relation === 'oneToMany' && relationship.targetTableForeignKeyColumn) {
        query.where(relationship.targetTableForeignKeyColumn, recordPrimaryKeyValue);
        countQuery?.where(relationship.targetTableForeignKeyColumn, recordPrimaryKeyValue);
      }
    }

    // Calculated columns
    if (tablePageConfig.calculatedColumns) {
      tablePageConfig.calculatedColumns.forEach(calculatedColumn => {
        query.select(this.client.raw(`(${calculatedColumn.sqlExpression}) as "${calculatedColumn.alias}"`));
      });
    }

    // Search
    if (input.search) {
      const searchValue = input.search.trim();
      if (tablePageProcessedConfig.searchableColumns?.length > 0) {
        query.where(this.getSearchBuilder(tablePageProcessedConfig.searchableColumns, searchValue));
        countQuery?.where(this.getSearchBuilder(tablePageProcessedConfig.searchableColumns, searchValue));
      }
    }

    // Sorting
    if (input.sorting) {
      if (tablePageProcessedConfig.sortableColumns?.includes(input.sorting.column)) {
        query.orderBy(`main.${input.sorting.column}`, input.sorting.direction);
      }
    } else if (tablePageProcessedConfig.defaultSortColumn && tablePageProcessedConfig.defaultSortDirection) {
      query.orderBy(`main.${tablePageProcessedConfig.defaultSortColumn}`, tablePageProcessedConfig.defaultSortDirection);
    }

    // Filters
    if (input.filters?.length) {
      this.applyFilters(query, input.filters, tableSchema.name, databaseSchema);
      if (countQuery) {
        this.applyFilters(countQuery, input.filters, tableSchema.name, databaseSchema);
      }
    }

    // Apply Knex modifier
    if (knexQueryModifier) {
      query = knexQueryModifier(query);
      countQuery = knexQueryModifier ? knexQueryModifier(countQuery) : countQuery;
    }

    // Select columns
    if (tablePageProcessedConfig.selectableColumns?.length > 0) {
      if (tablePageProcessedConfig.primaryKeyColumn && !tablePageProcessedConfig.selectableColumns.includes(tablePageProcessedConfig.primaryKeyColumn)) {
        tablePageProcessedConfig.selectableColumns.push(tablePageProcessedConfig.primaryKeyColumn);
      }
      query.select(...(new Set(tablePageProcessedConfig.selectableColumns.map(c => `main.${c}`))));
    } else {
      query.select('main.*');
    }
    countQuery?.count({ count: this.type === DataSourceAdapterType.knex_pg ? 'main.*' : '*' });

    return { query, countQuery, tablePageConfig, tablePageProcessedConfig, tableSchema, table };
  }

  /**
   * Get the table records (Table RPC) - UPDATED
   */
  async getTableRecords(
    rootTablePageConfig: TablePageConfig, 
    input: TablePageGetRecordsInput, 
    databaseSchema: RelationalDatabaseSchema
  ): Promise<TablePageGetRecordsResult> {
    // Handle custom SQL query
    if (rootTablePageConfig.fetchStrategy === 'rawSqlQuery' && rootTablePageConfig.customSqlQuery) {
      const limit = Math.min(input.pageSize || defaultTablePageSize, 1000);
      const records = await this.executeRawQuery(rootTablePageConfig.customSqlQuery, {
        offset: (input.page - 1) * limit,
        limit: input.pageSize,
      });
      const total = rootTablePageConfig.customSqlCountQuery 
        ? await this.executeRawQueryForSingleValue(rootTablePageConfig.customSqlCountQuery, {}) 
        : undefined;

      return {
        records: records as TablePageRecord[],
        total: total !== undefined ? Number(total) : undefined,
      };
    }

    // Build queries
    const { query, countQuery, tablePageProcessedConfig, tableSchema, table } = this.buildTableRecordsQuery(
      rootTablePageConfig, 
      input, 
      databaseSchema, 
      { includeCount: true }
    );

    // Apply pagination
    const limit = Math.min(input.pageSize || tablePageProcessedConfig.pageSize || defaultTablePageSize, 1000);
    const offset = (input.page - 1) * limit;
    query.limit(limit).offset(offset);

    // Execute queries
    const [records, countQueryResult] = await Promise.all([
      query,
      countQuery
    ]);
    const count = countQueryResult ? countQueryResult[0]?.count : undefined;

    // Process all records at once
    const processedRecords = await this.processTableRecords(
      records,
      table,
      tablePageProcessedConfig,
      tableSchema
    );

    return {
      records: processedRecords,
      total: Number(count ?? processedRecords.length),
    };
  }

  /**
   * Process records array
   */
  private async processTableRecords(
    records: TablePageRecord[],
    table: string,
    tablePageProcessedConfig: TablePageConfig,
    tableSchema: any
  ): Promise<any[]> {
    // Remove excluded columns from all records
    if (this.tablesConfig[table]?.excludedColumns) {
      records.forEach(record => {
        this.tablesConfig[table].excludedColumns?.forEach(column => {
          delete record[column];
        });
      });
    }

    // Enrich with related data
    await this.enrichRecordsWithRelatedData(records, tablePageProcessedConfig);

    // Prepare records according to schema
    const preparedRecords = tableSchema 
      ? await this.prepareRecords(records, tableSchema) 
      : records;

    return preparedRecords;
  }

  /*
   * Get table records as a stream
   */
  async getTableRecordsStream(
    rootTablePageConfig: TablePageConfig,
    input: TablePageGetRecordsInput,
    databaseSchema: RelationalDatabaseSchema
  ): Promise<Readable> {
    if (this.app?.readOnlyMode) {
      throw new Error('The record streaming is disabled in read-only mode');
    }
    
    // Handle custom SQL query
    if (rootTablePageConfig.fetchStrategy === 'rawSqlQuery' && rootTablePageConfig.customSqlQuery) {
      let offset = 0;
      let hasMore = true;

      const stream = new Readable({
        objectMode: true,
        read: async () => {
          if (!hasMore) {
            stream.push(null);
            return;
          }

          try {
            const records = await this.executeRawQuery(
              rootTablePageConfig.customSqlQuery!,
              {
                offset,
                limit: this.STREAM_CHUNK_SIZE,
              }
            );

            const count = records.length;

            for (const record of records) {
              stream.push(record);
            }

            // If query returned fewer than chunk size or returned too many (pagination doesn't apply), end the stream
            if (count !== this.STREAM_CHUNK_SIZE) {
              hasMore = false;
              stream.push(null);
              return;
            }

            offset += this.STREAM_CHUNK_SIZE;
          } catch (error) {
            stream.destroy(error);
          }
        },
      });

      return stream;
    }

    // Build queries
    const { query, tablePageProcessedConfig, tableSchema, table } = this.buildTableRecordsQuery(
      rootTablePageConfig, 
      input, 
      databaseSchema,
      { includeCount: false }
    );
    let offset = 0;
    let hasMore = true;

    // Create a readable stream that fetches data in chunks
    const stream = new Readable({
      objectMode: true,
      read: async () => {
        if (!hasMore) {
          // Finish the stream
          stream.push(null);
          return;
        }

        try {
          const chunkQuery = query.clone()
            .limit(this.STREAM_CHUNK_SIZE)
            .offset(offset);

          const records = await chunkQuery;
          const processedRecords = await this.processTableRecords(
            records,
            table,
            tablePageProcessedConfig,
            tableSchema
          );

          // Check if there are more records to fetch
          if (records.length < this.STREAM_CHUNK_SIZE) {
            hasMore = false;
          }

          for (const record of processedRecords) {
            stream.push(record);
          }

          if (records.length < this.STREAM_CHUNK_SIZE) {
            // Finish the stream
            stream.push(null);
          }
          offset += this.STREAM_CHUNK_SIZE;

        } catch (error) {
          stream.destroy(error);
        }
      }
    });

    return stream;
  }

  /**
   * Enrich the records with related data for visible relationships in the table
   * @returns The enriched records
   */
  private async enrichRecordsWithRelatedData(records: TablePageRecord[], tablePageProcessedConfig: TablePageConfig, forForm?: boolean): Promise<TablePageRecord[]> {
    // Collect all relationships
    const visibleRelationships = tablePageProcessedConfig.relationships?.filter(r => forForm ? true : !tablePageProcessedConfig?.linkedRecordsColumns?.some(lrc => lrc.relationshipKey === r.key && lrc.hiddenInTable)) || [];
    const oneToOneRelationships = (visibleRelationships.filter(r => r.relation === 'oneToOne') ?? []) as OneToOneRelationship[];
    const oneToManyRelationships = (visibleRelationships.filter(r => r.relation === 'oneToMany') ?? []) as OneToManyRelationship[];
    
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

        linkedTableRecords[relationship.targetTable] = [
          ...(linkedTableRecords[relationship.targetTable] || []),
          ...foreignRecords,
        ];
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
    if (oneToManyRelationships.length > 0) {
      await Promise.all(oneToManyRelationships.map(async relationship => {
        const foreignKeyValues = records.map(record => record[tablePageProcessedConfig.primaryKeyColumn!]);
        
        // TODO: replace with a single query
        const foreignTotalRecords: Record<string, number> = {};
        if (relationship.targetTableForeignKeyColumn) {
          await Promise.all(
            foreignKeyValues.map(async keyValue => {
              const recordForeignRecords = await this.client(relationship.targetTable)
                .count({ count: '*' })
                .where(relationship.targetTableForeignKeyColumn!, keyValue);

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

    // Select columns
    let columnsToSelect: string[] = [];
    if (columns?.length && !forPreview) {
      columnsToSelect = selectableColumns.length > 0 ? selectableColumns.concat([primaryKeyColumn]) : [primaryKeyColumn];
    } else {
      if (forPreview) {
        const rootConfigAsParentConfig = !input.nestedTableKey || input.nestedTableKey.length < 2;
        const parentTablePageConfig = rootConfigAsParentConfig ? rootTablePageConfig : getNestedTablePageConfigByTablePageNestedTableKey(rootTablePageConfig, input.nestedTableKey!.slice(0, -1)!);
        const parentTablePageProcessedConfig = getTableData({ tablePageConfig: parentTablePageConfig, databaseSchema }).tablePageProcessedConfig;
        const columnConfig = parentTablePageProcessedConfig.columns?.find(c => c.column === input.nestedTableKey?.[input.nestedTableKey.length - 1]?.parentForeignKey);
        columnsToSelect = [primaryKeyColumn, ...(columnConfig?.relationshipPreviewColumns ?? [])];
      } else if (!columns) {
        // If no columns are specified, select all columns
        columnsToSelect = [`*`];
      } else {
        columnsToSelect = [primaryKeyColumn!];
      }
    }
    query.select(...(new Set(columnsToSelect)));

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
    if (this.app?.readOnlyMode) {
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
    if (this.app?.readOnlyMode) {
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
    if (this.app?.readOnlyMode) {
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

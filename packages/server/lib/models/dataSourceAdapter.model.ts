import { Knex } from "knex";
import { DataSourceAdapterType, FormField, JsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn, RelationalDatabaseSchemaTable, TableRpc, TableRpcInputDelete, TableRpcInputInsert, TableRpcInputSelect, TableRpcInputSelectOperator, TableRpcInputUpdate, TableRpcResultInsertDTO, TableRpcResultSelectDTO, TableRpcResultSelectRecord, TableRpcResultUpdateDTO, TableRpcResultSelectRecordLinkedDTO, defaultTablePageSize, TableRpcInputSelectUsingExecuteQuery, TableRpcInputSelectSingle, TableRpcResultSelectSingleDTO, findLinkedItem, getPrimaryKeyColumnFromLinkedItem } from "@kottster/common";
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

  constructor(protected client: Knex) {}

  /**
   * Set the app instance
   */
  public setApp(app: KottsterApp): void {
    this.app = app;
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
   * Get the database schema
   * @returns The database schema
   */
  abstract getDatabaseSchema(tableNames?: string[]): Promise<RelationalDatabaseSchema>;

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
   * Get the table schema
   * @returns The table schema
   */
  async getTableSchemas(tableNames: string[]): Promise<RelationalDatabaseSchemaTable[]> {
    const schema = await this.getDatabaseSchema(tableNames);
    const tableSchemas = schema.tables.filter(table => tableNames.includes(table.name)) ?? null;
    
    return tableSchemas.map(tableSchema => ({
      ...tableSchema,
      columns: tableSchema.columns
    }));
  }

  /**
   * Get the table records (Table RPC)
   * @returns The table records
   */
  async getTableRecords(tableRpc: TableRpc, input: TableRpcInputSelect): Promise<TableRpcResultSelectDTO> {
    const linkedItem = input.linkedItemKey ? tableRpc.linked?.[input.linkedItemKey] : null;
    const primaryKeyColumn = linkedItem ? getPrimaryKeyColumnFromLinkedItem(linkedItem) : tableRpc.primaryKeyColumn;
    const executeQuery = linkedItem ? null : tableRpc.select.executeQuery;
    const table = linkedItem ? linkedItem.targetTable : tableRpc.table;
    const columns = linkedItem ? linkedItem.columns : tableRpc.select.columns;
    const searchableColumns = linkedItem ? linkedItem.searchableColumns : tableRpc.select.searchableColumns;
    const sortableColumns = linkedItem ? linkedItem.sortableColumns : tableRpc.select.sortableColumns;
    const filterableColumns = linkedItem ? linkedItem.filterableColumns : tableRpc.select.filterableColumns;
    const where = linkedItem ? [] : tableRpc.select.where;
    const orderBy = linkedItem ? [] : tableRpc.select.orderBy;
    const pageSize = linkedItem ? defaultTablePageSize : (tableRpc.select.pageSize || defaultTablePageSize);
    const linked = linkedItem ? linkedItem.linked : tableRpc.linked;
    
    // If a custom query is provided, execute it and return the result directly
    if (executeQuery) {
      return executeQuery(input as TableRpcInputSelectUsingExecuteQuery);
    }

    if (!table || !primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }
    
    const { tableSchema } = input;
    const query = this.client(table);
    const countQuery = this.client(table);

    // If primary key values are provided, filter by them
    if (input.primaryKeyValues && linkedItem) {
      query.whereIn(linkedItem.targetTableKeyColumn, input.primaryKeyValues);
      countQuery.whereIn(linkedItem.targetTableKeyColumn, input.primaryKeyValues);
    }

    // If foreign key values are provided and the relation is one-to-many, filter by them
    if (input.foreignKeyValues && linkedItem?.relation === 'oneToMany') {
      query.whereIn(linkedItem.targetTableForeignKeyColumn, input.foreignKeyValues);
      countQuery.whereIn(linkedItem.targetTableForeignKeyColumn, input.foreignKeyValues);
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
    if (input.filters) {
      input.filters.forEach(filter => {
        if (filterableColumns && filterableColumns.includes(filter.column)) {
          const operator: string = {
            equal: '=',
            notEqual: '<>',
          }[filter.operator as keyof typeof TableRpcInputSelectOperator];
          
          query.where(filter.column, operator, filter.value);
          countQuery.where(filter.column, operator, filter.value);
        }
      })
    };

    // Apply pagination
    const offset = (input.page - 1) * pageSize;
    query
      .limit(pageSize)
      .offset(offset);

    const [records, [{ count }]] = await Promise.all([
      query,
      countQuery
    ]);

    const linkedOneToOne = Object.fromEntries(
      Object.entries(linked ?? {})
        .filter(([, linkedItem]) => linkedItem.relation === 'oneToOne')
    ) as Record<string, OneToOneRelation>;
    
    const linkedOneToMany = Object.fromEntries(
      Object.entries(linked ?? {})
        .filter(([, linkedItem]) => linkedItem.relation === 'oneToMany')
    ) as Record<string, OneToManyRelation>;

    const linkedManyToMany = Object.fromEntries(
      Object.entries(linked ?? {})
        .filter(([, linkedItem]) => linkedItem.relation === 'manyToMany')
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
  async getOneTableRecord(tableRpc: TableRpc, input: TableRpcInputSelectSingle): Promise<TableRpcResultSelectSingleDTO> {
    const { linkedItemKey, primaryKeyValues, forPreview, tableSchema } = input;
    const linkedItem = linkedItemKey ? findLinkedItem(linkedItemKey, tableRpc.linked) : null;
    
    if ((linkedItemKey && !linkedItem) || !primaryKeyValues?.length) {
      throw new Error('Invalid primary key values or linked item key');
    }
    
    const columns = linkedItem ? linkedItem.columns : tableRpc.select.columns;
    const table = linkedItem ? linkedItem.targetTable : tableRpc.table;
    const primaryKeyColumn = linkedItem ? linkedItem.targetTableKeyColumn : tableRpc.primaryKeyColumn;
    if (!table || !primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
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
    const [preparedRecord] = await this.prepareRecords([record], tableSchema);
    
    return {
      record: preparedRecord,
    };
  };

  /**
   * Insert the table records (Table RPC)
   * @returns The table records
   */
  async insertTableRecord(tableRpc: TableRpc, input: TableRpcInputInsert): Promise<TableRpcResultInsertDTO> {
    const { tableSchema } = input;

    if (this.app.readOnlyMode) {
      throw new Error('Insert operation not permitted in read-only mode');
    }
    if (!tableRpc.insert) {
      throw new Error('Insert operation not permitted on this table');
    }

    // Check if the record can be inserted
    if (tableRpc.insert.canBeInserted && !tableRpc.insert.canBeInserted(input.values)) {
      throw new Error('Record cannot be inserted');
    }

    // Pre-process the input values
    if (tableRpc.insert.beforeInsert) {
      input.values = await tableRpc.insert.beforeInsert(input.values);
    } else {
      for (const key in input.values) {
        const columnSchema = tableSchema.columns.find(column => column.name === key);
        if (columnSchema) {
          input.values[key] = await this.prepareRecordValueBeforeUpsert(input.values[key], columnSchema);
        }
      }
    }

    await this.client(tableRpc.table).insert(input.values);

    return {};
  }

  /**
   * Update the table records (Table RPC)
   * @returns The table records
   */
  async updateTableRecords(tableRpc: TableRpc, input: TableRpcInputUpdate): Promise<TableRpcResultUpdateDTO> {
    if (!tableRpc.table || !tableRpc.primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }

    const { tableSchema } = input;

    if (this.app.readOnlyMode) {
      throw new Error('Update operation not permitted in read-only mode');
    }
    if (!tableRpc.update) {
      throw new Error('Update operation not permitted on this table');
    }

    // Check if the record can be updated
    if (tableRpc.update.canBeUpdated && !tableRpc.update.canBeUpdated(input.values)) {
      throw new Error('Record cannot be updated');
    }

    // Pre-process the input values
    if (tableRpc.update.beforeUpdate) {
      input.values = await tableRpc.update.beforeUpdate(input.values);
    } else {
      for (const key in input.values) {
        const columnSchema = tableSchema.columns.find(column => column.name === key);
        if (columnSchema) {
          input.values[key] = await this.prepareRecordValueBeforeUpsert(input.values[key], columnSchema);
        }
      }
    }

    await this.client(tableRpc.table)
      .whereIn(tableRpc.primaryKeyColumn, input.primaryKeys)
      .update(input.values);

    return {};
  }

  /**
   * Delete the table records (Table RPC)
   * @returns The table records
   */
  async deleteTableRecords(tableRpc: TableRpc, input: TableRpcInputDelete): Promise<true> {
    if (!tableRpc.table || !tableRpc.primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }

    if (this.app.readOnlyMode) {
      throw new Error('Delete operation not permitted in read-only mode');
    }
    if (!tableRpc.delete) {
      throw new Error('Delete operation not permitted on this table');
    }

    // Check if the record can be deleted
    if (tableRpc.delete.canBeDeleted && !tableRpc.delete.canBeDeleted(input.primaryKeys)) {
      throw new Error('Record cannot be deleted');
    }

    await this.client.table(tableRpc.table)
      .whereIn(tableRpc.primaryKeyColumn, input.primaryKeys)
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

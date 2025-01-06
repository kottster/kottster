import { Knex } from "knex";
import { DataSourceAdapterType, FormField, JsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn, RelationalDatabaseSchemaTable, TableRpc, TableRpcInputDelete, TableRpcInputInsert, TableRpcInputSelect, TableRpcInputSelectLinkedRecords, TableRpcInputSelectOperator, TableRpcInputUpdate, TableRpcResultInsertDTO, TableRpcResultSelectDTO, TableRpcResultSelectLinkedRecordsDTO, TableRpcResultSelectRecord, TableRpcResultUpdateDTO, TableRpcSelect, TableRpcLinkedTableOneToOne, TableRpcLinkedTableOneToMany, TableRpcResultSelectRecordLinkedDTO, TableRpcLinkedTable, TableRpcLinkedTableManyToMany, defaultTablePageSize, TableRpcInputSelectUsingExecuteQuery } from "@kottster/common";

/**
 * The base class for all data source adapters
 * @abstract
 */
export abstract class DataSourceAdapter {
  abstract type: DataSourceAdapterType;
  protected databaseSchemas: string[];

  constructor(protected client: Knex) {}

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
  abstract getDatabaseSchema(): Promise<RelationalDatabaseSchema>;

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
  async getTableSchema(tableName: string): Promise<RelationalDatabaseSchemaTable | null> {
    const schema = await this.getDatabaseSchema();
    const tableSchema = schema.tables.find(table => table.name === tableName) ?? null;
    
    if (!tableSchema) {
      return null;
    }

    return {
      ...tableSchema,
      columns: tableSchema.columns
    };
  }

  /**
   * Get the table records (Table RPC)
   * @returns The table records
   */
  async getTableRecords(tableRpc: TableRpc, input: TableRpcInputSelect): Promise<TableRpcResultSelectDTO> {
    // If a custom query is provided, execute it and return the result directly
    if (tableRpc.select.executeQuery) {
      return tableRpc.select.executeQuery(input as TableRpcInputSelectUsingExecuteQuery);
    }

    if (!tableRpc.table || !tableRpc.primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }
    
    const { tableSchema } = input;
    const query = this.client(tableRpc.table);
    const countQuery = this.client(tableRpc.table);

    // Select specific columns
    if (tableRpc.select.columns && tableRpc.select.columns.length > 0) {
      const columns = tableRpc.select.columns;
      if (tableRpc.primaryKeyColumn && !columns.includes(tableRpc.primaryKeyColumn)) {
        columns.push(tableRpc.primaryKeyColumn);
      }
      query.select(columns);
    } else {
      query.select('*');
    }
    countQuery.count({ count: '*' });

    // Apply where conditions
    if (tableRpc.select.where && tableRpc.select.where.length > 0) {
      tableRpc.select.where.forEach(condition => {
        query.where(condition.column, condition.operator, condition.value);
        countQuery.where(condition.column, condition.operator, condition.value);
      });
    }

    // Apply search
    if (input.search) {
      const searchableColumns = tableRpc.select.searchableColumns ?? [];
      const searchValue = input.search.trim();

      if (searchableColumns.length > 0) {
        query.where(this.getSearchBuilder(searchableColumns, searchValue));
        countQuery.where(this.getSearchBuilder(searchableColumns, searchValue));
      }
    }

    // Apply ordering
    if (input.sorting) {
      query.orderBy(input.sorting.column, input.sorting.direction);
    } else if (tableRpc.select.orderBy && tableRpc.select.orderBy.length > 0) {
      tableRpc.select.orderBy.forEach(order => {
        query.orderBy(order.column, order.direction);
      });
    } else {
      // By default, order by the primary key column
      query.orderBy(tableRpc.primaryKeyColumn, 'desc');
    }

    // Apply filters
    if (input.filters) {
      input.filters.forEach(filter => {
        const operator: string = {
          equal: '=',
          notEqual: '<>',
        }[filter.operator as keyof typeof TableRpcInputSelectOperator];
        
        query.where(filter.column, operator, filter.value);
        countQuery.where(filter.column, operator, filter.value);
      })
    };

    // Apply pagination
    const pageSize = tableRpc.select.pageSize || defaultTablePageSize;
    const offset = (input.page - 1) * pageSize;
    query
      .limit(pageSize)
      .offset(offset);

    const [records, [{ count }]] = await Promise.all([
      query,
      countQuery
    ]);

    const linkedOneToOne = Object.fromEntries(
      Object.entries(tableRpc.linked ?? {})
        .filter(([, linkedItem]) => linkedItem.relation === 'oneToOne')
    ) as Record<string, TableRpcLinkedTableOneToOne>;
    
    const linkedOneToMany = Object.fromEntries(
      Object.entries(tableRpc.linked ?? {})
        .filter(([, linkedItem]) => linkedItem.relation === 'oneToMany')
    ) as Record<string, TableRpcLinkedTableOneToMany>;

    const linkedManyToMany = Object.fromEntries(
      Object.entries(tableRpc.linked ?? {})
        .filter(([, linkedItem]) => linkedItem.relation === 'manyToMany')
    ) as Record<string, TableRpcLinkedTableManyToMany>;
    
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
          .select(linkedItem.columns ? [linkedItem.targetTableKeyColumn, ...linkedItem.columns] : [linkedItem.targetTableKeyColumn])
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
        const foreignKeyValues = records.map(record => record[tableRpc.primaryKeyColumn!]);
        
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
        if (linkedItem.relation === 'manyToMany') {
          await Promise.all(
            foreignKeyValues.map(async keyValue => {
              // Select the count of the records in the target table using the junction table
              const recordForeignRecords = await this.client(linkedItem.targetTable)
                .join(linkedItem.junctionTable, `${linkedItem.targetTable}.${linkedItem.targetTableKeyColumn}`, `${linkedItem.junctionTable}.${linkedItem.junctionTableTargetKeyColumn}`)
                .join(tableRpc.table!, `${linkedItem.junctionTable}.${linkedItem.junctionTableSourceKeyColumn}`, `${tableRpc.table}.${tableRpc.primaryKeyColumn}`)
                .where(`${tableRpc.table}.${tableRpc.primaryKeyColumn}`, keyValue)
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
          record['_linked'][linkedItemKey].totalRecords = foreignTotalRecords[record[tableRpc.primaryKeyColumn!]] ?? 0;
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
          preparedRecord[key] = await this.prepareRecordValue(value, columnSchema);
        };
      }));

      return preparedRecord;
    }));

    return preparedRecords;
  }

  /**
   * Get the linked table records (Table RPC)
   * @returns The table records
   */
  async getLinkedTableRecords(tableRpc: TableRpc, input: TableRpcInputSelectLinkedRecords): Promise<TableRpcResultSelectLinkedRecordsDTO> {
    if (!tableRpc.table || !tableRpc.primaryKeyColumn) {
      throw new Error('Table name or primary key column not provided');
    }
    
    tableRpc.select = tableRpc.select as TableRpcSelect;

    const linkedItem = tableRpc.linked?.[input.linkedItemKey] as TableRpcLinkedTable;
    if (!linkedItem) {
      throw new Error('Linked item not found');
    }
    
    const query = this.client(linkedItem.targetTable);
    const countQuery = this.client(linkedItem.targetTable);

    // If primary key values are provided, filter by them
    if (input.primaryKeyValues) {
      query.whereIn(linkedItem.targetTableKeyColumn, input.primaryKeyValues);
      countQuery.whereIn(linkedItem.targetTableKeyColumn, input.primaryKeyValues);
    }

    // If foreign key values are provided and the relation is one-to-many, filter by them
    if (input.foreignKeyValues && linkedItem.relation === 'oneToMany') {
      query.whereIn(linkedItem.targetTableForeignKeyColumn, input.foreignKeyValues);
      countQuery.whereIn(linkedItem.targetTableForeignKeyColumn, input.foreignKeyValues);
    }

    // If foreign key values are provided and the relation is many-to-many, filter by them
    if (input.foreignKeyValues && linkedItem.relation === 'manyToMany') {
      query.join(linkedItem.junctionTable, `${linkedItem.targetTable}.${linkedItem.targetTableKeyColumn}`, `${linkedItem.junctionTable}.${linkedItem.junctionTableTargetKeyColumn}`);
      countQuery.join(linkedItem.junctionTable, `${linkedItem.targetTable}.${linkedItem.targetTableKeyColumn}`, `${linkedItem.junctionTable}.${linkedItem.junctionTableTargetKeyColumn}`);

      query.join(tableRpc.table, `${linkedItem.junctionTable}.${linkedItem.junctionTableSourceKeyColumn}`, `${tableRpc.table}.${tableRpc.primaryKeyColumn}`);
      countQuery.join(tableRpc.table, `${linkedItem.junctionTable}.${linkedItem.junctionTableSourceKeyColumn}`, `${tableRpc.table}.${tableRpc.primaryKeyColumn}`);

      query.whereIn(`${tableRpc.table}.${tableRpc.primaryKeyColumn}`, input.foreignKeyValues);
      countQuery.whereIn(`${tableRpc.table}.${tableRpc.primaryKeyColumn}`, input.foreignKeyValues);
    }

    // Apply search
    if (input.search) {
      const searchableColumns = linkedItem.searchableColumns ?? [];
      const searchValue = input.search.trim();

      if (searchableColumns.length > 0) {
        query.where(this.getSearchBuilder(searchableColumns, searchValue));
        countQuery.where(this.getSearchBuilder(searchableColumns, searchValue));
      }
    }

    // Apply pagination
    // TODO: move page size to options
    const pageSize = 30;
    const offset = (input.page - 1) * pageSize;
    query
      .limit(pageSize)
      .offset(offset);

    // By default, order by the primary key column
    query.orderBy(linkedItem.targetTableKeyColumn, 'desc');

    // Select specific columns
    if (linkedItem.columns && linkedItem.columns.length > 0) {
      const columns = linkedItem.columns?.concat(linkedItem.targetTableKeyColumn) ?? [linkedItem.targetTableKeyColumn];
      query.select(columns.map(column => `${linkedItem.targetTable}.${column}`));
    } else {
      query.select(linkedItem.targetTableKeyColumn);
    }
    countQuery.count({ count: '*' });

    // Execute both queries in parallel
    const [records, [{ count }]] = await Promise.all([
      query,
      countQuery
    ]);

    return {
      records,
      totalRecords: Number(count),
    };
  };

  /**
   * Insert the table records (Table RPC)
   * @returns The table records
   */
  async insertTableRecord(tableRpc: TableRpc, input: TableRpcInputInsert): Promise<TableRpcResultInsertDTO> {
    const { tableSchema } = input;

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

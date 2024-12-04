import { Knex } from "knex";
import { DataSourceAdapterType, FormField, JsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn, TableRPC, TableRPCInputDelete, TableRPCInputInsert, TableRPCInputSelect, TableRPCInputSelectLinkedRecords, TableRPCInputSelectOperator, TableRPCInputUpdate, TableRPCResultSelectDTO, TableRPCResultSelectLinkedRecordsDTO, TableRPCResultSelectRecord, TableRPCResultUpdateDTO, TableRPCSelect, TableRPCSelectLinkedTableOneToOne } from "@kottster/common";

/**
 * The base class for all data source adapters
 * @abstract
 */
export abstract class DataSourceAdapter {
  abstract type: DataSourceAdapterType;

  // An array of available database schemas
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
   * Get the table schema
   * @returns The table schema
   */
  async getTableSchema(tableName: string): Promise<RelationalDatabaseSchema['tables'][number] | null> {
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
  async getTableRecords(tableRPC: TableRPC, input: TableRPCInputSelect): Promise<TableRPCResultSelectDTO> {
    tableRPC.select = tableRPC.select as TableRPCSelect;
    
    const query = this.client(tableRPC.table);
    const countQuery = this.client(tableRPC.table);

    // Select specific columns
    if (tableRPC.select.columns && tableRPC.select.columns.length > 0) {
      const columns = tableRPC.select.columns;
      if (tableRPC.primaryKeyColumn && !columns.includes(tableRPC.primaryKeyColumn)) {
        columns.push(tableRPC.primaryKeyColumn);
      }
      query.select();
    } else {
      query.select('*');
    }
    countQuery.count({ count: '*' });

    // Apply where conditions
    if (tableRPC.select.where && tableRPC.select.where.length > 0) {
      tableRPC.select.where.forEach(condition => {
        query.where(condition.column, condition.operator, condition.value);
        countQuery.where(condition.column, condition.operator, condition.value);
      });
    }

    // Apply search
    if (input.search) {
      const searchableColumns = tableRPC.select.searchableColumns ?? [];
      const searchValue = input.search.trim();

      if (searchableColumns.length > 0) {
        query.where((builder) => {
          searchableColumns.forEach((column, index) => {
            if (index === 0) {
              builder.where(column, 'ilike', `%${searchValue}%`);
            } else {
              builder.orWhere(column, 'ilike', `%${searchValue}%`);
            }
          });
        });
  
        countQuery.where((builder) => {
          searchableColumns.forEach((column, index) => {
            if (index === 0) {
              builder.where(column, 'ilike', `%${searchValue}%`);
            } else {
              builder.orWhere(column, 'ilike', `%${searchValue}%`);
            }
          });
        });
      }
    }

    // Apply ordering
    if (input.sorting) {
      query.orderBy(input.sorting.column, input.sorting.direction);
    } else if (tableRPC.select.orderBy && tableRPC.select.orderBy.length > 0) {
      tableRPC.select.orderBy.forEach(order => {
        query.orderBy(order.column, order.direction);
      });
    } else {
      // By default, order by the primary key column
      query.orderBy(tableRPC.primaryKeyColumn, 'desc');
    }

    // Apply filters
    if (input.filters) {
      input.filters.forEach(filter => {
        const operator: string = {
          equal: '=',
          notEqual: '<>',
        }[filter.operator as keyof typeof TableRPCInputSelectOperator];
        
        query.where(filter.column, operator, filter.value);
        countQuery.where(filter.column, operator, filter.value);
      })
    };

    // Apply pagination
    const offset = (input.page - 1) * tableRPC.select.pageSize;
    query
      .limit(tableRPC.select.pageSize)
      .offset(offset);

    const [records, [{ count }]] = await Promise.all([
      query,
      countQuery
    ]);

    const linkedOneToOne = tableRPC.select.linked?.filter(linkedItem => linkedItem.relation === 'oneToOne') ?? [];
    const linkedOneToMany = tableRPC.select.linked?.filter(linkedItem => linkedItem.relation === 'oneToMany') ?? [];
    
    // Preload linked one-to-one records
    if (linkedOneToOne.length > 0) {
      const linkedRecordKeys: Record<string, any[]> = {};

      records.forEach(record => {
        linkedOneToOne.forEach(linkedItem => {
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
        const linkedItem = linkedOneToOne?.find(linked => linked.foreignKeyColumn === column);
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
          const linkedItemIndex = linkedOneToOne?.findIndex(linked => linked.foreignKeyColumn === column) ?? -1;
          const linkedItem = linkedOneToOne?.[linkedItemIndex];
          if (!linkedItem) {
            return;
          }
          const linkedRecords: any[] = linkedTableRecords[linkedItem.targetTable];
          
          if (!record['_linked']) {
            record['_linked'] = [];
          }
          if (!record['_linked'][linkedItemIndex]) {
            record['_linked'][linkedItemIndex] = [];
          }
          
          linkedRecords.map(linkedRecord => {
            if (linkedRecord[linkedItem.targetTableKeyColumn] === record[column]) {
              // record['_linked'].push(linkedRecord);
              record['_linked'][linkedItemIndex].push(linkedRecord);
            }
          });
        });
      });
    }

    // Preload linked one-to-many records
    if (linkedOneToMany.length > 0) {
      await Promise.all(linkedOneToMany.map(async (linkedItem) => {
        const linkedItemIndex = tableRPC.select.linked?.indexOf(linkedItem) ?? -1;
        const foreignKeyValues = records.map(record => record[tableRPC.primaryKeyColumn]);
        
        // TODO: replace with a single query
        const foreignRecords: Record<string, any> = {};
        await Promise.all(
          foreignKeyValues.map(async keyValue => {
            const recordForeignRecords = await this.client(linkedItem.targetTable)
              .select(
                linkedItem.columns ? [
                  linkedItem.targetTableKeyColumn, 
                  ...linkedItem.columns
                ] : [
                  linkedItem.targetTableKeyColumn, 
                ]
              )
              .where(linkedItem.targetTableForeignKeyColumn, keyValue)
              .limit(linkedItem.previewMaxRecords)

              foreignRecords[keyValue] = recordForeignRecords;
          })
        );

        // Add linked records to the records
        records.forEach(record => {
          if (!record['_linked']) {
            record['_linked'] = [];
          }
          if (!record['_linked'][linkedItemIndex]) {
            record['_linked'][linkedItemIndex] = [];
          }

          // Loop through the foreign records and add them to the linked field
          record['_linked'][linkedItemIndex] = foreignRecords[record[tableRPC.primaryKeyColumn]] ?? [];
        });
      }));
    }

    return {
      records,
      totalRecords: Number(count),
    };
  };

  /**
   * Get the linked table records (Table RPC)
   * @returns The table records
   */
  async getLinkedTableRecords(tableRPC: TableRPC, input: TableRPCInputSelectLinkedRecords): Promise<TableRPCResultSelectLinkedRecordsDTO> {
    tableRPC.select = tableRPC.select as TableRPCSelect;

    const linkedItem = tableRPC.select.linked?.[input.linkedItemIndex] as TableRPCSelectLinkedTableOneToOne;
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

    // Apply search
    if (input.search) {
      const searchableColumns = linkedItem.searchableColumns ?? [];
      const searchValue = input.search.trim();

      if (searchableColumns.length > 0) {
        query.where((builder) => {
          searchableColumns.forEach((column, index) => {
            if (index === 0) {
              builder.where(column, 'ilike', `%${searchValue}%`);
            } else {
              builder.orWhere(column, 'ilike', `%${searchValue}%`);
            }
          });
        });
  
        countQuery.where((builder) => {
          searchableColumns.forEach((column, index) => {
            if (index === 0) {
              builder.where(column, 'ilike', `%${searchValue}%`);
            } else {
              builder.orWhere(column, 'ilike', `%${searchValue}%`);
            }
          });
        });
      }
    }

    // Apply pagination
    // TODO: move page size to options
    const pageSize = 30;
    const offset = (input.page - 1) * pageSize;
    query
      .limit(pageSize)
      .offset(offset);

    // Select specific columns
    if (linkedItem.columns && linkedItem.columns.length > 0) {
      const columns = linkedItem.columns?.concat(linkedItem.targetTableKeyColumn) ?? [linkedItem.targetTableKeyColumn];
      query.select(columns);
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
  async insertTableRecord(tableRPC: TableRPC, input: TableRPCInputInsert): Promise<TableRPCResultSelectRecord> {
    if (!tableRPC.insert) {
      throw new Error('Insert operation not permitted on this table');
    }

    // Check if the record can be inserted
    if (tableRPC.insert.canBeInserted && !tableRPC.insert.canBeInserted(input.values)) {
      throw new Error('Record cannot be inserted');
    }

    // Pre-process the input values
    if (tableRPC.insert.beforeInsert) {
      input.values = tableRPC.insert.beforeInsert(input.values);
    }

    const [record] = await this.client(tableRPC.table)
      .insert(input.values)
      .returning('*');

    return record;
  }

  /**
   * Update the table records (Table RPC)
   * @returns The table records
   */
  async updateTableRecords(tableRPC: TableRPC, input: TableRPCInputUpdate): Promise<TableRPCResultUpdateDTO> {
    if (!tableRPC.update) {
      throw new Error('Update operation not permitted on this table');
    }

    // Check if the record can be updated
    if (tableRPC.update.canBeUpdated && !tableRPC.update.canBeUpdated(input.values)) {
      throw new Error('Record cannot be updated');
    }

    // Pre-process the input values
    if (tableRPC.update.beforeUpdate) {
      input.values = tableRPC.update.beforeUpdate(input.values);
    }

    await this.client(tableRPC.table)
      .whereIn(tableRPC.primaryKeyColumn, input.primaryKeys)
      .update(input.values)
      .returning('*');

    return {
      // TODO: return updated records?
      records: []
    };
  }

  /**
   * Delete the table records (Table RPC)
   * @returns The table records
   */
  async deleteTableRecords(tableRPC: TableRPC, input: TableRPCInputDelete): Promise<true> {
    if (!tableRPC.delete) {
      throw new Error('Delete operation not permitted on this table');
    }

    // Check if the record can be deleted
    if (tableRPC.delete.canBeDeleted && !tableRPC.delete.canBeDeleted(input.primaryKeys)) {
      throw new Error('Record cannot be deleted');
    }

    await this.client.table(tableRPC.table)
      .whereIn(tableRPC.primaryKeyColumn, input.primaryKeys)
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

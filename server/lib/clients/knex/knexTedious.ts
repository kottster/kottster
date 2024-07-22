import { DataSourceClientType } from "@kottster/common";
import { DatabaseSchema } from "../../models/databaseSchema.model";
import { DataSourceClient } from "../../models/dataSourceClient.model";

export class KnexTedious extends DataSourceClient {
  type = DataSourceClientType.knex_tedious;

  async getDatabaseSchema(): Promise<DatabaseSchema> {
    // TODO
    const schemaName = 'dbo'; // this.connectionOptions?.searchPath?.[0];

    // Query to get all tables and their columns
    const tablesQueryResult = await this.client!.raw(`
      SELECT
        t.TABLE_NAME as table_name,
        c.COLUMN_NAME as column_name,
        c.DATA_TYPE as data_type,
        CASE WHEN c.IS_NULLABLE = 'YES' THEN 1 ELSE 0 END as nullable
      FROM
        INFORMATION_SCHEMA.TABLES t
        JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_SCHEMA = c.TABLE_SCHEMA
      WHERE
        t.TABLE_SCHEMA = ?;
    `, [schemaName]);

    const tablesData = tablesQueryResult;

    // Building the schema object
    const schema: DatabaseSchema = {
      name: schemaName,
      tables: [],
    };

    for (const row of tablesData) {
      const tableName = row.table_name;
      let table = schema.tables.find(table => table.name === tableName);

      if (!table) {
        // Table doesn't exist in the schema, create a new table object
        table = {
          name: tableName,
          columns: [],
        };
        schema.tables.push(table);
      }

      // Add the column to the table
      table.columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: !!row.nullable,
      });
    }
    return schema;
  }
}
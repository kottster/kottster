import { DataSourceAdapterType, FormField, JsType, PostgresBaseType, postgresBaseTypeToArrayReturn, postgresBaseTypeToJsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn } from "@kottster/common";
import { DataSourceAdapter } from "../../models/dataSourceAdapter.model";
import { Knex } from "knex";
import { parse as parsePostgresArray } from 'postgres-array';

export class KnexPg extends DataSourceAdapter {
  type = DataSourceAdapterType.knex_pg;

  constructor(protected client: Knex) {
    super(client);
  }

  private baseTypesDatePicker = [
    PostgresBaseType.date,
    PostgresBaseType.timestamp_without_time_zone,
    PostgresBaseType.timestamp_with_time_zone,
  ];
  
  private baseTypesTimePicker = [
    PostgresBaseType.time_without_time_zone,
    PostgresBaseType.time_with_time_zone,
  ];

  processColumn(column: RelationalDatabaseSchemaColumn) {
    // Check if it's an array type
    const isArray = column.type.endsWith('[]') || /ARRAY/i.test(column.type);

    // Remove array notation and normalize the type
    const cleanType = column.type
      .replace(/\[\]$/, '')           // Remove trailing []
      .replace(/ARRAY\[/i, '')        // Remove ARRAY[ notation
      .replace(/\]$/, '')             // Remove closing bracket from ARRAY
      .toLowerCase()
      .split('(')[0]
      .trim();

    if (!Object.values(PostgresBaseType).includes(cleanType as any) && cleanType !== 'user-defined') {
      console.warn(`Unknown column type: ${cleanType} (${column.type})`);
    }

    const returnedJsType = postgresBaseTypeToJsType[cleanType as keyof typeof PostgresBaseType] ?? JsType.string;
    const returnedAsArray = isArray && (postgresBaseTypeToArrayReturn[cleanType as keyof typeof postgresBaseTypeToArrayReturn] ?? false);

    let formField: FormField = { type: 'input' };
    if (column.foreignKey) {
      formField = {
        type: 'recordSelect',
        column: column.name,
      }
    } 
    else if (column.enumValues) {
      formField = {
        type: 'select',
        options: column.enumValues?.split(',').map(value => ({ label: value, value })) ?? []
      }
    }
    else if (this.baseTypesDatePicker.includes(cleanType as PostgresBaseType)) {
      formField = {
        type: 'datePicker'
      }
    }
    else if (this.baseTypesTimePicker.includes(cleanType as PostgresBaseType)) {
      formField = {
        type: 'timePicker'
      }
    }
    else {
      switch (returnedJsType) {
        case JsType.string:
        case JsType.buffer:
          formField = {
            type: 'input'
          }
          break;
        case JsType.number:
          formField = {
            type: 'numberInput'
          }
          break;
        case JsType.boolean:
          formField = {
            type: 'checkbox'
          }
          break;
        case JsType.date:
          formField = {
            type: 'datePicker'
          }
          break;
      }
    }

    return {
      isArray,
      returnedJsType,
      returnedAsArray,
      formField: {
        ...formField,
        asArray: isArray ?? undefined,
      },
    }
  }

  async prepareRecordValue(value, columnSchema: RelationalDatabaseSchemaColumn) {
    // If it's an array, but it's returned as a string, parse it
    if (columnSchema.isArray && !columnSchema.returnedAsArray && typeof value === 'string') {
      // TODO: Try to implement it using pg's `setTypeParser` function
      // https://github.com/brianc/node-pg-types
      return parsePostgresArray(value);
    }

    // If it should be an array, but it's not, return an empty array
    if (columnSchema.isArray && !Array.isArray(value)) {
      return [];
    }

    // If it's a date object, return it as an ISO string
    if (columnSchema.returnedJsType === JsType.date && value instanceof Date) {
      return value.toISOString();
    }

    // If it's a buffer, return it as a string
    if (columnSchema.returnedJsType === JsType.buffer && value instanceof Buffer) {
      return value.toString();
    }

    return value;
  }

  prepareRecordValueBeforeUpsert(value: any): any {
    return value;
  }

  getSearchBuilder(searchableColumns: string[], searchValue: string) {
    return (builder: Knex.QueryBuilder) => {
      searchableColumns.forEach((column, index) => {
        if (index === 0) {
          builder.where(column, 'ilike', `%${searchValue}%`);
        } else {
          builder.orWhere(column, 'ilike', `%${searchValue}%`);
        }
      });
    };
  }
  
  async getDatabaseSchema(): Promise<RelationalDatabaseSchema> {
    const schemaName = this.databaseSchemas[0] || 'public';

    // Query to get all tables and their columns with enum values, primary keys, and foreign keys
    const tablesQueryResult = await this.client!.raw(`
      WITH pk_info AS (
        SELECT
          c.table_name,
          c.column_name,
          pg_get_serial_sequence(c.table_name::text, c.column_name::text) IS NOT NULL as is_auto_increment
        FROM
          information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
            AND tc.table_schema = ccu.table_schema
          JOIN information_schema.columns c
            ON c.table_name = tc.table_name
            AND c.column_name = ccu.column_name
            AND c.table_schema = tc.table_schema
        WHERE
          tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = ?
      ),
      fk_info AS (
        SELECT
          kcu.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE
          tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = ?
      )
      SELECT
        t.table_name,
        c.column_name,
        CASE 
          WHEN c.data_type = 'ARRAY' THEN 
            (SELECT format_type(a.atttypid, a.atttypmod)
            FROM pg_catalog.pg_attribute a
            JOIN pg_catalog.pg_class cl ON cl.oid = a.attrelid
            JOIN pg_catalog.pg_namespace n ON n.oid = cl.relnamespace
            WHERE a.attname = c.column_name
            AND cl.relname = t.table_name
            AND n.nspname = t.table_schema)
          ELSE c.data_type
        END as data_type,
        CASE WHEN c.data_type = 'USER-DEFINED' THEN (
          SELECT string_agg(e.enumlabel, ',')
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = c.udt_name
        ) ELSE NULL END AS enum_values,
        c.is_nullable = 'YES' AS nullable,
        pk.is_auto_increment,
        fk.foreign_table_name,
        fk.foreign_column_name
      FROM
        information_schema.tables t
        JOIN information_schema.columns c 
          ON t.table_name = c.table_name 
          AND t.table_schema = c.table_schema
        LEFT JOIN pk_info pk
          ON t.table_name = pk.table_name
          AND c.column_name = pk.column_name
        LEFT JOIN fk_info fk
          ON t.table_name = fk.table_name
          AND c.column_name = fk.column_name
      WHERE
        t.table_schema = ?;
    `, [schemaName, schemaName, schemaName]);

    const tablesData = tablesQueryResult.rows;

    // Building the schema object
    const schema: RelationalDatabaseSchema = {
      name: schemaName,
      tables: [],
    };

    for (const row of tablesData) {
      const tableName = row.table_name;
      let table = schema.tables.find(table => table.name === tableName);

      if (!table) {
        // If the table doesn't exist in the schema, create a new table object
        table = {
          name: tableName,
          columns: [],
        };
        schema.tables.push(table);
      }
      const column: RelationalDatabaseSchemaColumn = {
        name: row.column_name,
        type: row.data_type,
        nullable: row.nullable,
        enumValues: row.enum_values,
      };

      if (row.is_auto_increment !== null) {
        column.primaryKey = {
          autoIncrement: row.is_auto_increment,
        };
      }

      if (row.foreign_table_name) {
        column.foreignKey = {
          table: row.foreign_table_name,
          column: row.foreign_column_name
        };
      }

      const { isArray, returnedAsArray, returnedJsType, formField } = this.processColumn(column);
      
      table.columns.push({
        ...column,
        formField,
        isArray,
        returnedJsType,
        returnedAsArray,
      });
    }

    return schema;
  }
}
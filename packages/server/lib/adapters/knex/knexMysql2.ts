import { DataSourceAdapterType, FormField, JsType, MysqlBaseType, mysqlBaseTypeToJsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn } from "@kottster/common";
import { DataSourceAdapter } from "../../models/dataSourceAdapter.model";
import { Knex } from "knex";

export class KnexMysql2 extends DataSourceAdapter {
  type = DataSourceAdapterType.knex_mysql2;

  constructor(protected client: Knex) {
    super(client);
  }

  private baseTypesDatePicker = [
    MysqlBaseType.timestamp,
    MysqlBaseType.datetime,
  ];

  private baseTypesTimePicker = [
    MysqlBaseType.time,
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

    const returnedJsType = mysqlBaseTypeToJsType[cleanType as keyof typeof MysqlBaseType] ?? JsType.string;
    const returnedAsArray = false;

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
    else if (this.baseTypesDatePicker.includes(cleanType as MysqlBaseType)) {
      formField = {
        type: 'datePicker'
      }
    }
    else if (this.baseTypesTimePicker.includes(cleanType as MysqlBaseType)) {
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

  prepareRecordValue(value: any, columnSchema: RelationalDatabaseSchemaColumn): any {
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

  prepareRecordValueBeforeUpsert(value: any, columnSchema: RelationalDatabaseSchemaColumn): any {
    // Convert ISO string to MySQL datetime format (without timezone)
    if (
      [MysqlBaseType.timestamp, MysqlBaseType.datetime, MysqlBaseType.time].includes(columnSchema.type as MysqlBaseType)
    ) {
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?$/;

      if (isoPattern.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().slice(0, 19).replace('T', ' ');
        }
      }

      return value;
    }
    // TODO: Or Convert to JSON here
    
    return value;
  }

  getSearchBuilder(searchableColumns: string[], searchValue: string) {
    const finalSearchValue = searchValue.toLowerCase();

    return (builder: Knex.QueryBuilder) => {
      searchableColumns.forEach((column, index) => {
        if (index === 0) {
          builder.whereRaw(`LOWER(${column}) LIKE ?`, [`%${finalSearchValue}%`]);
        } else {
          builder.orWhereRaw(`LOWER(${column}) LIKE ?`, [`%${finalSearchValue}%`]);
        }
      });
    };
  }

  async getDatabaseSchema(): Promise<RelationalDatabaseSchema> {
    const schemaName = this.databaseSchemas[0];

    const tablesResult = await this.client!.raw(`
      SELECT table_name AS table_name
      FROM information_schema.tables 
      WHERE table_schema = COALESCE(?, DATABASE()) AND table_type = 'BASE TABLE'
    `, [schemaName ?? null]);

    const tables = tablesResult[0];

    const databaseSchema: RelationalDatabaseSchema = {
      name: schemaName,
      tables: []
    };

    for (const table of tables) {
      const tableName = table.table_name;

      // Get column info including primary key
      const columnsResult = await this.client!.raw(`
        SELECT 
          c.column_name AS column_name,
          c.data_type AS data_type,
          c.column_type AS column_type,
          c.is_nullable AS is_nullable,
          c.extra AS extra,
          tc.constraint_type AS constraint_type
        FROM information_schema.columns c
        LEFT JOIN information_schema.key_column_usage kcu 
          ON c.table_schema = kcu.table_schema 
          AND c.table_name = kcu.table_name 
          AND c.column_name = kcu.column_name
        LEFT JOIN information_schema.table_constraints tc
          ON kcu.constraint_name = tc.constraint_name
          AND kcu.table_schema = tc.table_schema
          AND kcu.table_name = tc.table_name
        WHERE c.table_schema = COALESCE(?, DATABASE()) 
        AND c.table_name = ?
      `, [schemaName ?? null, tableName]);

      // Get foreign key info
      const foreignKeysResult = await this.client!.raw(`
        SELECT
          kcu.column_name AS column_name,
          kcu.referenced_table_name AS referenced_table_name,
          kcu.referenced_column_name AS referenced_column_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc
          ON kcu.constraint_name = tc.constraint_name
          AND kcu.table_schema = tc.table_schema
          AND kcu.table_name = tc.table_name
        WHERE kcu.table_schema = COALESCE(?, DATABASE())
          AND kcu.table_name = ?
          AND tc.constraint_type = 'FOREIGN KEY'
      `, [schemaName ?? null, tableName]);

      const columns = columnsResult[0];
      const foreignKeys = foreignKeysResult[0];

      const schemaColumns: RelationalDatabaseSchemaColumn[] = columns.map(columnData => {
        const enumValues = columnData.column_type.includes('enum')
          ? columnData.column_type.replace(/enum\((.*)\)/, '$1').replace(/'/g, '')
          : undefined;

        const isPrimaryKey = columnData.constraint_type === 'PRIMARY KEY';
        const isAutoIncrement = columnData.extra?.toLowerCase().includes('auto_increment');

        const foreignKey = foreignKeys.find(fk => fk.column_name === columnData.column_name);

        const column: RelationalDatabaseSchemaColumn = {
          name: columnData.column_name,
          type: columnData.data_type,
          nullable: columnData.is_nullable === 'YES',
          enumValues,
        };

        if(isPrimaryKey) {
          column.primaryKey = {
            autoIncrement: isAutoIncrement
          };
        }

        if(foreignKey) {
          column.foreignKey = {
            table: foreignKey.referenced_table_name,
            column: foreignKey.referenced_column_name
          };
        }

        const { isArray, returnedAsArray, returnedJsType, formField } = this.processColumn(column);

        return {
          ...column,
          formField,
          isArray,
          returnedJsType,
          returnedAsArray,
        };
      });

      databaseSchema.tables.push({
        name: tableName,
        columns: schemaColumns
      });
    }

    return databaseSchema;
  }
}
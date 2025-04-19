import { DataSourceAdapterType, FilterItem, FilterItemOperator, FieldInput, isIsoString, JsType, MysqlBaseType, mysqlBaseTypesByContentHint, mysqlBaseTypeToJsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn, removeTrailingZeros } from "@kottster/common";
import { DataSourceAdapter } from "../../models/dataSourceAdapter.model";
import { Knex } from "knex";
import { ContentHint } from "@kottster/common/dist/models/contentHint.model";

export class KnexMysql2 extends DataSourceAdapter {
  type = DataSourceAdapterType.knex_mysql2;

  constructor(protected client: Knex) {
    super(client);
  }

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

    const contentHint = Object.keys(mysqlBaseTypesByContentHint).find(key => mysqlBaseTypesByContentHint[key].includes(cleanType)) as ContentHint | undefined;
    const returnedJsType = mysqlBaseTypeToJsType[cleanType as keyof typeof MysqlBaseType] ?? JsType.string;
    const returnedAsArray = false;

    let fieldInput: FieldInput = { type: 'input' };
    if (column.foreignKey) {
      fieldInput = {
        type: 'recordSelect',
      }
    } 
    else if (column.enumValues) {
      fieldInput = {
        type: 'select',
        options: column.enumValues?.split(',').map(value => ({ label: value, value })) ?? []
      }
    }
    else if ([
      MysqlBaseType.timestamp, 
      MysqlBaseType.datetime, 
      MysqlBaseType.date,
    ].includes(cleanType as MysqlBaseType)) {
      fieldInput = {
        type: (cleanType === MysqlBaseType.timestamp || cleanType === MysqlBaseType.datetime) ? 'dateTimePicker' : 'datePicker',
      }
    }
    else if ([MysqlBaseType.time,].includes(cleanType as MysqlBaseType)) {
      fieldInput = {
        type: 'timePicker'
      }
    }
    // Assuming that tinyint(1) is a boolean
    else if (column.fullType === 'tinyint(1)') {
      fieldInput = {
        type: 'checkbox',
      }
    }
    else if (cleanType === MysqlBaseType.char) {
      fieldInput = {
        type: 'input',
        maxLength: 1,
      }
    }
    else if ([
      MysqlBaseType.text,
      MysqlBaseType.longtext,
      MysqlBaseType.mediumtext,
      MysqlBaseType.json,
      MysqlBaseType.blob,
      MysqlBaseType.mediumblob,
      MysqlBaseType.longblob,
    ].includes(cleanType as MysqlBaseType)) {
      fieldInput = {
        type: 'textarea',
      }
    }
    else {
      switch (returnedJsType) {
        case JsType.string:
        case JsType.buffer:
          fieldInput = {
            type: 'input'
          }
          break;
        case JsType.number:
          fieldInput = {
            type: 'numberInput'
          }
          break;
        case JsType.boolean:
          fieldInput = {
            type: 'checkbox'
          }
          break;
        case JsType.date:
          fieldInput = {
            type: 'datePicker'
          }
          break;
      }
    }

    return {
      isArray,
      returnedJsType,
      returnedAsArray,
      contentHint,
      fieldInput: {
        ...fieldInput,
        asArray: isArray ?? undefined,
      },
    }
  }

  prepareRecordValue(value: any, columnSchema: RelationalDatabaseSchemaColumn): any {
    const type = columnSchema.type as MysqlBaseType;
    
    // If it's a date object, return it as an ISO string
    if (
      [
        MysqlBaseType.timestamp, 
        MysqlBaseType.datetime, 
        MysqlBaseType.date, 
        MysqlBaseType.time
      ].includes(type) 
      && value instanceof Date
    ) {
      return value.toISOString();
    }

    // If it's a buffer, return it as a string
    if (
      [
        MysqlBaseType.blob,
        MysqlBaseType.longblob,
        MysqlBaseType.mediumblob,
        MysqlBaseType.varbinary,
        MysqlBaseType.binary,
        MysqlBaseType.tinyblob,
      ].includes(type) 
      && value instanceof Buffer
    ) {
      return value.toString();
    }

    // Remove the excess decimal points to avoid showing values like 23.000000000000000000000000000000
    if (type === MysqlBaseType.decimal && typeof value === 'string') {
      return removeTrailingZeros(value);
    }
    
    return value;
  }

  prepareRecordValueBeforeUpsert(value: any, columnSchema: RelationalDatabaseSchemaColumn): any {
    // Convert ISO string to MySQL datetime format (without timezone)
    if (
      [
        MysqlBaseType.timestamp, 
        MysqlBaseType.datetime, 
        MysqlBaseType.date, 
        MysqlBaseType.time
      ].includes(columnSchema.type as MysqlBaseType)
    ) {
      if (isIsoString(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().slice(0, 19).replace('T', ' ');
        }
      }

      return value;
    }
    
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

  getFilterBuilder(filterItems: FilterItem[]) {
    return (builder: Knex.QueryBuilder) => {
      filterItems.forEach(filterItem => {
        if (filterItem.value === undefined || filterItem.value === null || filterItem.value === '') {
          return;
        }
  
        switch (filterItem.operator) {
          case FilterItemOperator.equal:
            builder.where(filterItem.column, filterItem.value);
            break;
          case FilterItemOperator.notEqual:
            builder.whereNot(filterItem.column, filterItem.value);
            break;
          case FilterItemOperator.greaterThan:
            builder.where(filterItem.column, '>', filterItem.value);
            break;
          case FilterItemOperator.lessThan:
            builder.where(filterItem.column, '<', filterItem.value);
            break;
          case FilterItemOperator.between:
            builder.whereBetween(filterItem.column, filterItem.value);
            break;
          case FilterItemOperator.notBetween:
            builder.whereNotBetween(filterItem.column, filterItem.value);
            break;
          case FilterItemOperator.isNull:
            builder.whereNull(filterItem.column);
            break;
          case FilterItemOperator.isNotNull:
            builder.whereNotNull(filterItem.column);
            break;
          case FilterItemOperator.isTrue:
            builder.where(filterItem.column, true);
            break;
          case FilterItemOperator.isFalse:
            builder.where(filterItem.column, false);
            break;
          case FilterItemOperator.contains:
            builder.whereRaw(`${filterItem.column} LIKE LOWER(?)`, [`%${filterItem.value}%`]);
            break;
          case FilterItemOperator.notContains:
            builder.whereRaw(`${filterItem.column} NOT LIKE LOWER(?)`, [`%${filterItem.value}%`]);
            break;
          case FilterItemOperator.startsWith:
            builder.whereRaw(`${filterItem.column} LIKE LOWER(?)`, [`${filterItem.value}%`]);
            break;
          case FilterItemOperator.endsWith:
            builder.whereRaw(`${filterItem.column} LIKE LOWER(?)`, [`%${filterItem.value}`]);
            break;
          case FilterItemOperator.dateEquals:
            builder.whereRaw(`DATE(${filterItem.column}) = ?`, [filterItem.value]);
            break;
          case FilterItemOperator.dateAfter:
            builder.where(filterItem.column, '>', filterItem.value);
            break;
          case FilterItemOperator.dateBefore:
            builder.where(filterItem.column, '<', filterItem.value);
            break;
          case FilterItemOperator.dateBetween:
            builder.whereBetween(filterItem.column, filterItem.value);
            break;
          case FilterItemOperator.dateNotBetween:
            builder.whereNotBetween(filterItem.column, filterItem.value);
            break;
          default:
            throw new Error(`Unsupported filter operator: ${filterItem.operator}`);
        }
      });
    };
  }

  async getDatabaseTableCount(): Promise<number> {
    const schemaName = this.databaseSchemas[0];
    
    const countQueryResult = await this.client!.raw(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = COALESCE(?, DATABASE()) AND table_type = 'BASE TABLE'
    `, [schemaName ?? null]);
    
    return parseInt(countQueryResult[0][0].table_count);
  }

  async getDatabaseSchemaRaw(): Promise<RelationalDatabaseSchema> {
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
          fullType: columnData.column_type,
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

        const { isArray, returnedAsArray, returnedJsType, fieldInput, contentHint } = this.processColumn(column);

        return {
          ...column,
          fieldInput,
          contentHint,
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
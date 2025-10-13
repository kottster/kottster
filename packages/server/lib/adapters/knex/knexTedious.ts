import { DataSourceAdapterType, FilterItem, FilterItemOperator, FieldInput, isIsoString, JsType, mssqlBaseTypesByContentHint, mssqlBaseTypeToJsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn, removeTrailingZeros, MssqlBaseType } from "@kottster/common";
import { DataSourceAdapter } from "../../models/dataSourceAdapter.model";
import { Knex } from "knex";
import { ContentHint } from "@kottster/common/dist/models/contentHint.model";

export class KnexTedious extends DataSourceAdapter {
  type = DataSourceAdapterType.knex_tedious;

  constructor(protected client: Knex) {
    super(client);
  }

  processColumn(column: RelationalDatabaseSchemaColumn) {
    // Check if it's an array type (less common in MSSQL, but handle if present)
    const isArray = column.type.endsWith('[]') || /ARRAY/i.test(column.type);

    // Remove array notation and normalize the type
    const cleanType = column.type
      .replace(/\[\]$/, '')           // Remove trailing []
      .replace(/ARRAY\[/i, '')        // Remove ARRAY[ notation
      .replace(/\]$/, '')             // Remove closing bracket from ARRAY
      .toLowerCase()
      .split('(')[0]
      .trim();

    const contentHint = Object.keys(mssqlBaseTypesByContentHint).find(key => mssqlBaseTypesByContentHint[key].includes(cleanType)) as ContentHint | undefined;
    const returnedJsType = mssqlBaseTypeToJsType[cleanType as keyof typeof MssqlBaseType] ?? JsType.string;
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
      MssqlBaseType.datetime, 
      MssqlBaseType.datetime2, 
      MssqlBaseType.smalldatetime,
      MssqlBaseType.datetimeoffset,
      MssqlBaseType.date,
    ].includes(cleanType as MssqlBaseType)) {
      fieldInput = {
        type: (cleanType === MssqlBaseType.datetime || cleanType === MssqlBaseType.datetime2 || cleanType === MssqlBaseType.smalldatetime || cleanType === MssqlBaseType.datetimeoffset) ? 'dateTimePicker' : 'datePicker',
      }
    }
    else if ([MssqlBaseType.time,].includes(cleanType as MssqlBaseType)) {
      fieldInput = {
        type: 'timePicker'
      }
    }
    // MSSQL bit type is used for boolean
    else if (cleanType === MssqlBaseType.bit) {
      fieldInput = {
        type: 'checkbox',
      }
    }
    else if (cleanType === MssqlBaseType.char || cleanType === MssqlBaseType.nchar) {
      fieldInput = {
        type: 'input',
        maxLength: 1,
      }
    }
    else if ([
      MssqlBaseType.varchar,
      MssqlBaseType.nvarchar,
      MssqlBaseType.text,
      MssqlBaseType.ntext,
      MssqlBaseType.xml,
      MssqlBaseType.varbinary,
      MssqlBaseType.binary,
      MssqlBaseType.image,
    ].includes(cleanType as MssqlBaseType)) {
      fieldInput = {
        type: 'textarea',
      }
    }
    else {
      switch (returnedJsType) {
        case JsType.string:
        case JsType.buffer:
          fieldInput = {
            type: 'textarea'
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
    const type = columnSchema.type as MssqlBaseType;
    
    if (
      [
        MssqlBaseType.datetime, 
        MssqlBaseType.datetime2, 
        MssqlBaseType.smalldatetime,
        MssqlBaseType.datetimeoffset,
        MssqlBaseType.date,
      ].includes(type) 
      && value instanceof Date
    ) {
      return value.toISOString();
    }

    if (
      [
        MssqlBaseType.varbinary,
        MssqlBaseType.binary,
        MssqlBaseType.image,
      ].includes(type) 
      && value instanceof Buffer
    ) {
      return value.toString();
    }

    if (
      [
        MssqlBaseType.decimal, 
        MssqlBaseType.numeric, 
        MssqlBaseType.money, 
        MssqlBaseType.smallmoney
      ].includes(type) 
      && typeof value === 'string'
    ) {
      return removeTrailingZeros(value);
    }
    
    return value;
  }

  prepareRecordValueBeforeUpsert(value: any, columnSchema: RelationalDatabaseSchemaColumn): any {
    // Convert Buffer to string for binary types
    if (
      [
        MssqlBaseType.binary,
        MssqlBaseType.varbinary,
        MssqlBaseType.image,
      ].includes(columnSchema.type as MssqlBaseType)
    ) {
      return Buffer.from(value, 'utf8');
    }
    
    // Convert ISO string to SQL Server datetime format (without timezone)
    if (
      [
        MssqlBaseType.datetime, 
        MssqlBaseType.datetime2, 
        MssqlBaseType.smalldatetime,
        MssqlBaseType.datetimeoffset,
        MssqlBaseType.date,
      ].includes(columnSchema.type as MssqlBaseType)
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

  applyFilterCondition(
    builder: Knex.QueryBuilder,
    filterItem: FilterItem,
    columnReference: string
  ) {
    switch (filterItem.operator) {
      case FilterItemOperator.equal:
        builder.where(columnReference, filterItem.value ?? '');
        break;
      case FilterItemOperator.notEqual:
        builder.whereNot(columnReference, filterItem.value ?? '');
        break;
      case FilterItemOperator.greaterThan:
        if (filterItem.value) {
          builder.where(columnReference, '>', filterItem.value);
        }
        break;
      case FilterItemOperator.lessThan:
        if (filterItem.value) {
          builder.where(columnReference, '<', filterItem.value);
        }
        break;
      case FilterItemOperator.between:
        if (filterItem.value) {
          builder.whereBetween(columnReference, filterItem.value);
        }
        break;
      case FilterItemOperator.notBetween:
        if (filterItem.value) {
          builder.whereNotBetween(columnReference, filterItem.value);
        }  
        break;
      case FilterItemOperator.isNull:
        builder.whereNull(columnReference);
        break;
      case FilterItemOperator.isNotNull:
        builder.whereNotNull(columnReference);
        break;
      case FilterItemOperator.isTrue:
        builder.where(columnReference, true);
        break;
      case FilterItemOperator.isFalse:
        builder.where(columnReference, false);
        break;
      case FilterItemOperator.contains:
        builder.whereRaw(`${columnReference} LIKE LOWER(?)`, [`%${filterItem.value ?? ''}%`]);
        break;
      case FilterItemOperator.notContains:
        builder.whereRaw(`${columnReference} NOT LIKE LOWER(?)`, [`%${filterItem.value ?? ''}%`]);
        break;
      case FilterItemOperator.startsWith:
        builder.whereRaw(`${columnReference} LIKE LOWER(?)`, [`${filterItem.value ?? ''}%`]);
        break;
      case FilterItemOperator.endsWith:
        builder.whereRaw(`${columnReference} LIKE LOWER(?)`, [`%${filterItem.value ?? ''}`]);
        break;
      case FilterItemOperator.dateEquals:
        builder.whereRaw(`CAST(${columnReference} AS DATE) = ?`, [filterItem.value ?? '']);
        break;
      case FilterItemOperator.dateAfter:
        if (filterItem.value) {
          builder.where(columnReference, '>', filterItem.value);
        }
        break;
      case FilterItemOperator.dateBefore:
        if (filterItem.value) {
          builder.where(columnReference, '<', filterItem.value);
        }
        break;
      case FilterItemOperator.dateBetween:
        if (filterItem.value) {
          builder.whereBetween(columnReference, filterItem.value);
        }
        break;
      case FilterItemOperator.dateNotBetween:
        if (filterItem.value) {
          builder.whereNotBetween(columnReference, filterItem.value);
        }
        break;
      default:
        throw new Error(`Unsupported filter operator: ${filterItem.operator}`);
    }
  }

  async getDatabaseTableCount(): Promise<number> {
    const schemaName = this.databaseSchemas[0];

    const countQueryResult = await this.client!.raw(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = COALESCE(?, 'dbo') AND table_type = 'BASE TABLE'
    `, [schemaName ?? null]);
    
    return parseInt(countQueryResult[0].table_count);
  }

  async getDatabaseSchemaRaw(): Promise<RelationalDatabaseSchema> {
    const schemaName = this.databaseSchemas[0];
    
    // Get all tables in the schema
    const tablesResult = await this.client!.raw(`
      SELECT TABLE_NAME AS table_name
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = COALESCE(?, SCHEMA_NAME()) AND TABLE_TYPE = 'BASE TABLE'
    `, [schemaName ?? null]);
    
    const tables = tablesResult;
    
    const databaseSchema: RelationalDatabaseSchema = {
      name: schemaName,
      tables: []
    };
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      // Get column info including primary key and identity
      const columnsResult = await this.client!.raw(`
        SELECT 
          c.COLUMN_NAME AS column_name,
          c.DATA_TYPE AS data_type,
          c.IS_NULLABLE AS is_nullable,
          COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') AS is_identity,
          tc.CONSTRAINT_TYPE AS constraint_type
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
          ON c.TABLE_SCHEMA = kcu.TABLE_SCHEMA 
          AND c.TABLE_NAME = kcu.TABLE_NAME 
          AND c.COLUMN_NAME = kcu.COLUMN_NAME
        LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
          ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
          AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA
          AND kcu.TABLE_NAME = tc.TABLE_NAME
        WHERE c.TABLE_SCHEMA = COALESCE(?, SCHEMA_NAME()) 
          AND c.TABLE_NAME = ?
      `, [schemaName ?? null, tableName]);
      
      // Get foreign key info
      const foreignKeysResult = await this.client!.raw(`
        SELECT
          kcu1.COLUMN_NAME AS column_name,
          kcu2.TABLE_NAME AS referenced_table_name,
          kcu2.COLUMN_NAME AS referenced_column_name
        FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu1
          ON rc.CONSTRAINT_NAME = kcu1.CONSTRAINT_NAME
          AND rc.CONSTRAINT_SCHEMA = kcu1.CONSTRAINT_SCHEMA
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu2
          ON rc.UNIQUE_CONSTRAINT_NAME = kcu2.CONSTRAINT_NAME
          AND rc.UNIQUE_CONSTRAINT_SCHEMA = kcu2.CONSTRAINT_SCHEMA
        WHERE kcu1.TABLE_SCHEMA = COALESCE(?, SCHEMA_NAME())
          AND kcu1.TABLE_NAME = ?
      `, [schemaName ?? null, tableName]);
      
      const columns = columnsResult;
      const foreignKeys = foreignKeysResult;
      
      const schemaColumns: RelationalDatabaseSchemaColumn[] = columns.map(columnData => {
        // MSSQL doesn't have ENUM types, so we skip this
        const enumValues = undefined;
        
        const isPrimaryKey = columnData.constraint_type === 'PRIMARY KEY';
        const isAutoIncrement = columnData.is_identity === 1;
        
        const foreignKey = foreignKeys.find(fk => fk.column_name === columnData.column_name);
        
        const column: RelationalDatabaseSchemaColumn = {
          name: columnData.column_name,
          type: columnData.data_type,
          fullType: columnData.data_type, // MSSQL doesn't have column_type
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
import { DataSourceAdapterType, FilterItem, FilterItemOperator, FieldInput, JsType, RelationalDatabaseSchema, RelationalDatabaseSchemaColumn, SqliteBaseType, sqliteBaseTypesByContentHint, sqliteBaseTypeToJsType, ContentHint } from "@kottster/common";
import { DataSourceAdapter } from "../../models/dataSourceAdapter.model";
import { Knex } from "knex";

export class KnexBetterSqlite3 extends DataSourceAdapter {
  type = DataSourceAdapterType.knex_better_sqlite3;

  constructor(protected client: Knex) {
    super(client);
  }

  processColumn(column: RelationalDatabaseSchemaColumn) {
    // Remove array notation and normalize the type
    const cleanType = column.type
      .toLowerCase()
      .replace(/\[\]$/, '')           // Remove trailing []
      .split('(')[0]                  // Remove size notation
      .trim();

    const contentHint = Object.keys(sqliteBaseTypesByContentHint).find(key => sqliteBaseTypesByContentHint[key].includes(cleanType)) as ContentHint | undefined;
    const returnedJsType = sqliteBaseTypeToJsType[cleanType as keyof typeof SqliteBaseType] ?? JsType.string;
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
      SqliteBaseType.date,
      SqliteBaseType.datetime,
    ].includes(cleanType as SqliteBaseType)) {
      fieldInput = {
        type: cleanType === SqliteBaseType.datetime ? 'dateTimePicker' : 'datePicker',
      }
    }
    else if ([
      SqliteBaseType.character,
      SqliteBaseType.varchar,
      SqliteBaseType.varying_character,
      SqliteBaseType.nchar,
      SqliteBaseType.native_character,
      SqliteBaseType.nvarchar,
      SqliteBaseType.text,
      SqliteBaseType.clob,
    ].includes(cleanType as SqliteBaseType)) {
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
      isArray: false,
      returnedJsType,
      returnedAsArray,
      contentHint,
      fieldInput: {
        ...fieldInput,
        asArray: false,
      },
    }
  }

  async prepareRecordValue(value, columnSchema: RelationalDatabaseSchemaColumn) {
    const type = columnSchema.type as SqliteBaseType;

    // If it's a date object, return it as an ISO string
    if (
      [
        SqliteBaseType.date,
        SqliteBaseType.datetime,
      ].includes(type) 
    ) {
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === 'string') {
        return new Date(value).toISOString();
      }
      if (typeof value === 'number') {
        return new Date(value).toISOString();
      }
    }

    // If it's a buffer, return it as a string
    if (SqliteBaseType.blob === type && value instanceof Buffer) {
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
          builder.whereRaw('?? LIKE ? COLLATE NOCASE', [column, `%${searchValue}%`]);
        } else {
          builder.orWhereRaw('?? LIKE ? COLLATE NOCASE', [column, `%${searchValue}%`]);
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
        builder.where(columnReference, 1);
        break;
      case FilterItemOperator.isFalse:
        builder.where(columnReference, 0);
        break;
      case FilterItemOperator.contains:
        builder.where(columnReference, 'LIKE', `%${filterItem.value ?? ''}%`);
        break;
      case FilterItemOperator.notContains:
        builder.whereNot(columnReference, 'LIKE', `%${filterItem.value ?? ''}%`);
        break;
      case FilterItemOperator.startsWith:
        builder.where(columnReference, 'LIKE', `${filterItem.value ?? ''}%`);
        break;
      case FilterItemOperator.endsWith:
        builder.where(columnReference, 'LIKE', `%${filterItem.value ?? ''}`);
        break;
      case FilterItemOperator.dateEquals:
        builder.whereRaw(`date(${columnReference}) = date(?)`, [filterItem.value ?? '']);
        break;
      case FilterItemOperator.dateAfter:
        builder.whereRaw(`date(${columnReference}) > date(?)`, [filterItem.value ?? '']);
        break;
      case FilterItemOperator.dateBefore:
        builder.whereRaw(`date(${columnReference}) < date(?)`, [filterItem.value ?? '']);
        break;
      case FilterItemOperator.dateBetween:
        if (Array.isArray(filterItem.value)) {
          builder.whereRaw(`date(${columnReference}) BETWEEN date(?) AND date(?)`, [
            filterItem.value[0],
            filterItem.value[1],
          ]);
        }
        break;
      case FilterItemOperator.dateNotBetween:
        if (Array.isArray(filterItem.value)) {
          builder.whereRaw(`date(${columnReference}) NOT BETWEEN date(?) AND date(?)`, [
            filterItem.value[0],
            filterItem.value[1],
          ]);
        }
        break;
      default:
        throw new Error(`Unsupported filter operator: ${filterItem.operator}`);
    }
  }

  async getDatabaseTableCount(): Promise<number> {
    const countQueryResult = await this.client!.raw(`
      SELECT COUNT(*) as table_count
      FROM sqlite_master
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    `);
    
    return parseInt(countQueryResult[0].table_count);
  }
  
  async getDatabaseSchemaRaw(): Promise<RelationalDatabaseSchema> {
    const databaseSchema: RelationalDatabaseSchema = {
      name: 'main', // SQLite's default schema name
      tables: []
    };

    // Get all tables
    const tablesResult = await this.client!.raw(`
      SELECT name as table_name
      FROM sqlite_master
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    `);

    const tables = tablesResult;

    for await (const table of tables) {
      const tableName = table.table_name;

      // Get column info
      const columnsResult = await this.client!.raw(`PRAGMA table_info("${tableName}")`);
      
      // Get foreign key info
      const foreignKeysResult = await this.client!.raw(`PRAGMA foreign_key_list("${tableName}")`);

      const schemaColumns: RelationalDatabaseSchemaColumn[] = await Promise.all(columnsResult.map(async (columnData: any) => {
        // Dirty hack to indicate that the column is enum-like
        const tableInfoSql = await this.client!.raw(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [tableName]);
        const createTableSql = tableInfoSql[0]?.sql || '';
        const enumMatch = createTableSql.match(
          new RegExp(`${columnData.name}.*?CHECK.*?\\((${columnData.name}\\s+IN\\s+\\([^)]+\\))\\)`)
        );
        const enumValues = enumMatch 
          ? enumMatch[1].match(/\'([^']+)\'/g)?.map(v => v.replace(/'/g, '')).join(',')
          : undefined;

        const column: RelationalDatabaseSchemaColumn = {
          name: columnData.name,
          type: columnData.type.toLowerCase(),
          fullType: columnData.type.toLowerCase(),
          nullable: columnData.notnull === 0,
          enumValues,
        };

        if (columnData.pk === 1) {
          column.primaryKey = {
            autoIncrement: /autoincrement/i.test(createTableSql)
          };
        }

        const foreignKey = foreignKeysResult.find(fk => fk.from === columnData.name);
        if (foreignKey) {
          column.foreignKey = {
            table: foreignKey.table,
            column: foreignKey.to
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
      }));

      databaseSchema.tables.push({
        name: tableName,
        columns: schemaColumns
      });
    }

    return databaseSchema;
  }
}
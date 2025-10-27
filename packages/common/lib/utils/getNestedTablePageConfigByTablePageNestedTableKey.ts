import { RelationalDatabaseSchema, RelationalDatabaseSchemaTable } from "../models/databaseSchema.model";
import { TablePageConfig, TablePageNestedTableKey } from "../models/tablePage.model";
import { transformTablePageNestedTableKeyToString } from "./transformTablePageNestedTableKeyToString";

/**
 * Get nested table page config by its nested table key.
 * @param rootTablePageConfig The parent table page config.
 * @param key The nested table key.
 * @param databaseSchema The database schema.
 * @returns The nested table page config.
 */
export function getNestedTablePageConfigByTablePageNestedTableKey(
  rootTablePageConfig: TablePageConfig, 
  key: TablePageNestedTableKey
): TablePageConfig {
  if (!key || key.length === 0) {
    throw new Error(`Can't get nested TablePageConfig with empty key`);
  };

  const lastNestedKeyItem = key[key.length - 1];
  const defaultTablePageConfig: TablePageConfig = {
    table: lastNestedKeyItem.table,
    fetchStrategy: 'databaseTable',
  }

  // For backward compatibility, check both nested table key and its legacy version
  // The bug was fixed in v3.4.0
  const keyString = transformTablePageNestedTableKeyToString(key);
  const keyStringLegacy = keyString.replace(/__c__/g, '__p__');
  const nestedTablePageConfig = rootTablePageConfig.nested?.[keyString] ?? rootTablePageConfig.nested?.[keyStringLegacy] ?? defaultTablePageConfig;

  return nestedTablePageConfig;
}

export function getNestedTablePageConfigByTablePageNestedTableKeyAndVerify(
  rootTablePageConfig: TablePageConfig, 
  key: TablePageNestedTableKey, 
  databaseSchema: RelationalDatabaseSchema,
): TablePageConfig {
  const result = getNestedTablePageConfigByTablePageNestedTableKey(
    rootTablePageConfig,
    key
  );

  const rootTableSchema: RelationalDatabaseSchemaTable | undefined = databaseSchema.tables.find(t => t.name === rootTablePageConfig.table);
  let parentTableSchema: RelationalDatabaseSchemaTable | undefined = undefined;
  let parentTablePageConfig: TablePageConfig | undefined = undefined;
  let currentTableSchema: RelationalDatabaseSchemaTable | undefined = rootTableSchema;
  let currentTablePageConfig: TablePageConfig | undefined = rootTablePageConfig;

  Object.values(key).forEach(keyItem => {
    parentTableSchema = currentTableSchema;
    parentTablePageConfig = currentTablePageConfig;

    currentTableSchema = databaseSchema.tables.find(t => t.name === keyItem.table);
    currentTablePageConfig = currentTablePageConfig?.nested?.[transformTablePageNestedTableKeyToString(
      key.slice(0, key.indexOf(keyItem) + 1)
    )];

    // One-to-one relationship      
    if (keyItem.parentForeignKey) {

      const foreignKeyColumnConfig = parentTablePageConfig?.columns?.find(c => c.column === keyItem.parentForeignKey);
      const foreignKeyColumnSchema = parentTableSchema?.columns.find(c => c.name === keyItem.parentForeignKey);

      if (!foreignKeyColumnSchema) {
        throw new Error(`Can't access nested table "${keyItem.table}". Foreign key column "${keyItem.parentForeignKey}" does not exist.`);
      }

      if (foreignKeyColumnConfig && foreignKeyColumnConfig.hiddenInTable) {
        throw new Error(`Can't access nested table "${keyItem.table}". Foreign key column is hidden.`);
      }

    } 
    // One-to-many relationship
    else if (keyItem.childForeignKey) {

      const linkedRecordsColumn = parentTablePageConfig?.linkedRecordsColumns?.find(r => 
        r.relationshipKey === `${keyItem.table}__c__${keyItem.childForeignKey}`
      );
      const foreignKeyColumnSchema = currentTableSchema?.columns.find(c => c.name === keyItem.childForeignKey && c.foreignKey?.table === parentTableSchema?.name);
      if (!foreignKeyColumnSchema) {
        throw new Error(`Can't access nested table "${keyItem.table}". Foreign key column "${keyItem.childForeignKey}" does not exist.`);
      }

      if (linkedRecordsColumn && linkedRecordsColumn.hiddenInTable) {
        throw new Error(`Can't access nested table "${keyItem.table}". Linked records column is hidden.`);
      }
    }
  });

  return result;
}
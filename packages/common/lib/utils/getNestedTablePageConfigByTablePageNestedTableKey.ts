import { TablePageConfig, TablePageNestedTableKey } from "../models/tablePage.model";
import { transformTablePageNestedTableKeyToString } from "./nestedKeyTransformation";

export function getNestedTablePageConfigByTablePageNestedTableKey(tablePageConfig: TablePageConfig, key: TablePageNestedTableKey): TablePageConfig {
  if (!key || key.length === 0) {
    throw new Error(`Can't get nested TablePageConfig with empty key`);
  };

  const lastNestedKeyItem = key[key.length - 1];

  const defaultTablePageConfig: TablePageConfig = {
    table: lastNestedKeyItem.table,
    fetchStrategy: 'databaseTable',
  }
  
  if (!tablePageConfig.nested) {
    return defaultTablePageConfig;
  };

  const keyString = transformTablePageNestedTableKeyToString(key);

  return tablePageConfig.nested[keyString] ?? defaultTablePageConfig;
}
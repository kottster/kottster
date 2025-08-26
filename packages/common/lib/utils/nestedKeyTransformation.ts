import { TablePageConfig, TablePageNestedTableKey } from "../models/tablePage.model";

export function transformTablePageNestedTableKeyToString(key: TablePageNestedTableKey): string {
  return key.map(item => {
    if (item.parentForeignKey) {
      return `${item.table}__p__${item.parentForeignKey}`;
    } else if (item.childForeignKey) {
      return `${item.table}__c__${item.childForeignKey}`;
    } else {
      throw new Error(`Invalid NestedTableKeyItem: ${JSON.stringify(item)}`);
    }
  }).join('___');
}

export function transformStringToTablePageNestedTableKey(str: string): TablePageNestedTableKey {
  if (!str) return [];
  
  return str.split('___').map(segment => {
    if (segment.includes('__p__')) {
      const [table, fk] = segment.split('__p__');
      return { table, parentForeignKey: fk };
    } else if (segment.includes('__c__')) {
      const [table, fk] = segment.split('__c__');
      return { table, childForeignKey: fk };
    } else {
      throw new Error(`Invalid segment format: ${segment}`);
    }
  });
}

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
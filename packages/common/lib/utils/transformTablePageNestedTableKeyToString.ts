import { TablePageNestedTableKey } from "../models/tablePage.model";

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
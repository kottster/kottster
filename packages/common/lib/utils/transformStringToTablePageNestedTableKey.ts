import { TablePageNestedTableKey } from "../models/tablePage.model";

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
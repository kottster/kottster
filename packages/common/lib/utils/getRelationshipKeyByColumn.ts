import { TablePageConfig } from "../models/tablePage.model";

/**
 * Find the relationship key by column name
 * @param relationships The relationships array
 * @param column The column name
 */
export function getRelationshipKeyByColumn(
  relationships: TablePageConfig['relationships'] = [], 
  column: string
): string | undefined {
  return relationships.find(item => item.relation === 'oneToOne' && item.foreignKeyColumn === column)?.key;
}
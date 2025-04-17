import { TablePageConfig } from "../models/tablePage.model";

/**
 * Find the relationship key by column name
 * @param linked The linked object
 * @param column The relationship key
 */
export function getRelationshipKeyByColumn(relationships: TablePageConfig['relationships'] = [], column: string): string | undefined {
  return relationships.find(item => item.relation === 'oneToOne' && item.foreignKeyColumn === column)?.key;
}
import { Relationship, TablePageConfig } from "../models/tablePage.model";
import { getRelationshipKeyByColumn } from "./getRelationshipKeyByColumn";

/**
 * Find the relationship by column name
 * @param linked The linked object
 * @param column The relationship
 */
export function getRelationshipByColumn(relationships: TablePageConfig['relationships'] = [], column: string): (Relationship & { relation: 'oneToOne' }) | undefined {
  const relationshipKey = getRelationshipKeyByColumn(relationships, column);
  const relationship = relationships.find(i => i.key === relationshipKey);
  
  if (!relationshipKey || !relationship) {
    return undefined;
  }
  
  return relationship as Relationship & { relation: 'oneToOne' };
}
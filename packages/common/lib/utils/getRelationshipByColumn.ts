import { OneToOneRelationship } from "../models/relationship.model";
import { TablePageConfig } from "../models/tablePage.model";
import { getRelationshipKeyByColumn } from "./getRelationshipKeyByColumn";

/**
 * Find the relationship by column name
 * @param relationships The relationships array
 * @param column The column name
 */
export function getRelationshipByColumn(
  relationships: TablePageConfig['relationships'] = [], 
  column: string
): OneToOneRelationship | undefined {
  const relationshipKey = getRelationshipKeyByColumn(relationships, column);
  const relationship = relationships.find(i => i.key === relationshipKey);
  
  if (!relationshipKey || !relationship) {
    return undefined;
  }
  
  return relationship as OneToOneRelationship;
}
import { Relationship } from "../models/relationship.model";
import { TablePageConfig } from "../models/tablePage.model";

/**
 * Find a relationship by its key in relationships array
 * @param relationshipKey The key of the relationship to find
 * @param linked The linked object to search in
 * @returns The relationship if found, otherwise undefined
 */
export function findRelationship(relationshipKey: string, relationships?: TablePageConfig['relationships']): Relationship | undefined {
  if (!relationships) {
    return undefined;
  }

  const directMatch = relationships.find(i => i.key === relationshipKey);
  if (directMatch) {
    return directMatch;
  }

  for (const item of relationships) {
    const nestedResult = findRelationship(relationshipKey, item.relationships);
    if (nestedResult) {
      return nestedResult;
    }
  }

  return undefined;
}
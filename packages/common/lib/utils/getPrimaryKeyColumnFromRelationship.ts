import { Relationship } from "../models/tablePage.model";

/**
 * Get the primary key column based on the relationship object
 * @param relationship The relationship object
 * @returns The primary key column name
 */
export function getPrimaryKeyColumnFromRelationship(relationship: Relationship): string {
  return relationship.targetTableKeyColumn ?? 'id';
}
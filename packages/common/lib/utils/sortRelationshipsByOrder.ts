import { TablePageConfig } from "../models/tablePage.model";

/**
 * Sort relationships by their order
 * @param relationships The relationships to sort
 * @returns The sorted relationships
 */
export function sortRelationshipsByOrder(relationships: TablePageConfig['relationships']): TablePageConfig['relationships'] {
  return relationships?.sort((a, b) => {
    const aIndex = a.position ?? -1;
    const bIndex = b.position ?? -1;

    if (aIndex === -1 && bIndex === -1) {
      return 0;
    } else if (aIndex === -1) {
      return 1;
    } else if (bIndex === -1) {
      return -1;
    } else {
      return aIndex - bIndex;
    }
  });
}
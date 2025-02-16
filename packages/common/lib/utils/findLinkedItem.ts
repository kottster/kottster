import { LinkedItem, TableRpc } from "../models/tableRpc.model";

/**
 * Find a linked item in a linked object
 * @param linkedItemKey The key of the linked item to find
 * @param linked The linked object to search in
 * @returns The linked item if found, otherwise undefined
 */
export function findLinkedItem(linkedItemKey: string, linked?: TableRpc['linked']): LinkedItem | undefined {
  if (!linked) {
    return undefined;
  }

  const directMatch = linked[linkedItemKey];
  if (directMatch) {
    return directMatch;
  }

  for (const item of Object.values(linked)) {
    const nestedResult = findLinkedItem(linkedItemKey, item.linked);
    if (nestedResult) {
      return nestedResult;
    }
  }

  return undefined;
}
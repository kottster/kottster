import { TableRpc } from "../models/tableRpc.model";

/**
 * Sort linked keys by order
 * @param columns The linked keys to sort
 * @returns The sorted linked keys
 */
export function sortLinkedKeysByOrder(linkedKeys: string[], linkedItemsOrder?: TableRpc['linkedItemsOrder']): string[] {
  // Sort columns based on columnsOrder
  return linkedItemsOrder ? [...linkedKeys].sort((a, b) => {
    const aIndex = linkedItemsOrder.indexOf(a) ?? -1;
    const bIndex = linkedItemsOrder.indexOf(b) ?? -1;

    if (aIndex === -1 && bIndex === -1) {
      return 0;
    } else if (aIndex === -1) {
      return 1;
    } else if (bIndex === -1) {
      return -1;
    } else {
      return aIndex - bIndex;
    }
  }) : linkedKeys;
}
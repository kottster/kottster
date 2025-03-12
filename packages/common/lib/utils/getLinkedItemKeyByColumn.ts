import { TableRpc } from "../models/tableRpc.model";

/**
 * Find the linked item key by column name
 * @param linked The linked object
 * @param column The linked item key
 */
export function getLinkedItemKeyByColumn(linked: TableRpc['linked'] = {}, column: string): string | undefined {
  return Object.entries(linked ?? {}).find(([, linkedItem]) => linkedItem.relation === 'oneToOne' && linkedItem.foreignKeyColumn === column)?.[0];
}
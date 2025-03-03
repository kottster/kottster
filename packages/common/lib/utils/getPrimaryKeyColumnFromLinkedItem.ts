import { LinkedItem } from "../models/tableRpc.model";

export function getPrimaryKeyColumnFromLinkedItem(linkedItem: LinkedItem): string {
  return linkedItem.targetTableKeyColumn ?? 'id';
}
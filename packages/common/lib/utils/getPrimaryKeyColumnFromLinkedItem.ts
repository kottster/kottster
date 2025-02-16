import { LinkedItem } from "../models/tableRpc.model";

export function getPrimaryKeyColumnFromLinkedItem(linkedItem: LinkedItem): string {
  switch (linkedItem.relation) {
    case 'oneToOne':
    case 'oneToMany':
      return linkedItem.targetTableKeyColumn;
    case 'manyToMany':
      return linkedItem.junctionTableTargetKeyColumn;
    default:
      return 'id';
  }
}
import { RelationalDatabaseSchemaColumn } from "../models/databaseSchema.model";
import { TableRpc } from "../models/tableRpc.model";
import { findNameLikeColumns } from "./findNameLikeColumns";

// TODO: rename to sortColumnsByOrder
/**
 * Sorts columns by priority
 * @param columns The columns to sort
 * @returns The sorted columns
 */
export function sortColumnsByPriority(columns: RelationalDatabaseSchemaColumn[], columnsOrder?: TableRpc['columnsOrder']): RelationalDatabaseSchemaColumn[] {
  // Sort by column name
  columns = [...columns].sort((a, b) => {
    const getPriority = (column: RelationalDatabaseSchemaColumn): number => {
      if (column.primaryKey) {
        return 1;
      }

      if (findNameLikeColumns(columns).find((name: string) => name === column.name)) {
        return 2;
      }

      if (column.foreignKey) {
        return 6;
      }

      if (column.contentHint === 'string') {
        return 3;
      }

      if (column.contentHint === 'number' || column.contentHint === 'boolean') {
        return 4;
      }

      if (column.contentHint === 'date') {
        return 5;
      }

      return 6;
    };

    const priorityA = getPriority(a);
    const priorityB = getPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return a.name.localeCompare(b.name);
  });
  
  // Sort columns based on columnsOrder
  return columnsOrder ? [...columns].sort((a, b) => {
    const aIndex = columnsOrder.indexOf(a.name) ?? -1;
    const bIndex = columnsOrder.indexOf(b.name) ?? -1;

    if (aIndex === -1 && bIndex === -1) {
      return 0;
    } else if (aIndex === -1) {
      return 1;
    } else if (bIndex === -1) {
      return -1;
    } else {
      return aIndex - bIndex;
    }
  }) : columns;
}
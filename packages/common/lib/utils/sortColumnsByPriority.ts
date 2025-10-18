import { RelationalDatabaseSchemaColumn } from "../models/databaseSchema.model";
import { TablePageConfig } from "../models/tablePage.model";
import { findNameLikeColumns } from "./findNameLikeColumns";

/**
 * Sort columns by priority and transform them into TablePageConfig column format
 * @param columns The columns to sort
 * @param tablePageConfigColumns Optional existing table page config columns
 * @returns The sorted columns
 */
export function sortColumnsByPriority(
  columns: RelationalDatabaseSchemaColumn[], 
  tablePageConfigColumns?: TablePageConfig['columns']
): TablePageConfig['columns'] {
  // Sort by column name
  const sortedColumns = [...columns].sort((a, b) => {
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
  
  // Apply existing table config ordering if provided
  const orderedColumns = tablePageConfigColumns 
    ? [...sortedColumns].sort((a, b) => {
      const aIndex = tablePageConfigColumns.find(c => c.column === a.name)?.position ?? -1;
      const bIndex = tablePageConfigColumns.find(c => c.column === b.name)?.position ?? -1;

      if (aIndex === -1 && bIndex === -1) {
        return 0;
      } else if (aIndex === -1) {
        return 1;
      } else if (bIndex === -1) {
        return -1;
      } else {
        return aIndex - bIndex;
      }
    })
    : sortedColumns;
  
  return orderedColumns
    .map(column => {
      const existingConfig = tablePageConfigColumns?.find(c => c.column === column.name);
      
      return existingConfig;
    })
    .filter(c => !!c);
}
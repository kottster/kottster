import { RelationalDatabaseSchema } from "../models/databaseSchema.model";
import { LinkedItem, TableRpc } from "../models/tableRpc.model";
import { findNameLikeColumns } from "./findNameLikeColumns";

/**
 * Get all possible linked items for a given table
 * @param tableRpc
 * @param databaseSchema
 * @returns The list of all possible linked items
 */
export function getAllPossibleLinked(tableRpc: TableRpc, databaseSchema: RelationalDatabaseSchema): TableRpc['linked'] {
  const tableSchema = databaseSchema?.tables?.find(t => t.name === tableRpc.table);
  const linked: TableRpc['linked'] = {};

  if (!tableSchema) {
    return linked;
  }

  // Add possible one-to-one relations
  tableSchema.columns.forEach(col => {
    if (!col.foreignKey) {
      return;
    }

    const foreignTableSchema = col.foreignKey && databaseSchema.tables.find(t => t.name === col.foreignKey?.table);

    const linkedItemKey = col.name;
    const linkedItem: LinkedItem = {
      relation: 'oneToOne',
      foreignKeyColumn: col.name,
      targetTable: col.foreignKey.table,
      targetTableKeyColumn: col.foreignKey.column,
      previewColumns: tableRpc.linkedItemPreviewColumns?.[linkedItemKey] ?? findNameLikeColumns(foreignTableSchema?.columns ?? []),
    };

    linked[linkedItemKey] = linkedItem;
  });

  // Add possible one-to-many relations
  const tablesThatHasThisTableAsForeignKey = databaseSchema?.tables.filter((foreignTableSchema) => foreignTableSchema.columns.some((column) => column.foreignKey?.table === tableRpc.table)) ?? [];
  tablesThatHasThisTableAsForeignKey.map(foreignTable => {
    const targetTableKeyColumn = foreignTable.columns.find(column => column.primaryKey);
    const targetTableForeignColumn = foreignTable.columns.find(
      column => column.foreignKey?.table === tableRpc.table
    );

    if (!targetTableKeyColumn || !targetTableForeignColumn) {
      return;
    }
    
    const linkedItemKey = `${foreignTable.name}_by_${targetTableForeignColumn.name}`;
    const linkedItem: LinkedItem = {
      relation: 'oneToMany',
      targetTable: foreignTable.name,
      targetTableKeyColumn: targetTableKeyColumn.name,
      targetTableForeignKeyColumn: targetTableForeignColumn.name,
    };

    linked[linkedItemKey] = linkedItem;
  });

  return linked;
}
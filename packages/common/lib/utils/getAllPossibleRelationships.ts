import { RelationalDatabaseSchema } from "../models/databaseSchema.model";
import { Relationship } from "../models/relationship.model";
import { TablePageConfig } from "../models/tablePage.model";

/**
 * Get all possible relationships for a given table
 * @param tablePage
 * @param databaseSchema
 * @returns The list of all possible relationships
 */
export function getAllPossibleRelationships(tablePageConfig: TablePageConfig, databaseSchema: RelationalDatabaseSchema): TablePageConfig['relationships'] {
  const tableSchema = databaseSchema?.tables?.find(t => t.name === tablePageConfig.table);
  const relationships: TablePageConfig['relationships'] = [];

  if (!tableSchema) {
    return relationships;
  }

  // Add possible one-to-one relations
  tableSchema.columns.forEach(col => {
    if (!col.foreignKey) {
      return;
    }

    const relationshipKey = `${col.foreignKey.table}__p__${col.name}`;
    const relationship: Relationship = {
      key: relationshipKey,
      relation: 'oneToOne',
      foreignKeyColumn: col.name,
      targetTable: col.foreignKey.table,
      targetTableKeyColumn: col.foreignKey.column,
    };

    relationships.push(relationship);
  });

  // Add possible one-to-many relations
  const tablesThatHasThisTableAsForeignKey = databaseSchema?.tables.filter((foreignTableSchema) => foreignTableSchema.columns.some((column) => column.foreignKey?.table === tablePageConfig.table)) ?? [];
  tablesThatHasThisTableAsForeignKey.map(foreignTable => {
    const targetTableKeyColumn = foreignTable.columns.find(column => column.primaryKey);
    const targetTableForeignColumn = foreignTable.columns.find(
      column => column.foreignKey?.table === tablePageConfig.table
    );

    if (!targetTableKeyColumn || !targetTableForeignColumn) {
      return;
    }

    const relationshipKey = `${foreignTable.name}__c__${targetTableForeignColumn.name}`;
    const relationship: Relationship = {
      key: relationshipKey,
      relation: 'oneToMany',
      targetTable: foreignTable.name,
      targetTableKeyColumn: targetTableKeyColumn.name,
      targetTableForeignKeyColumn: targetTableForeignColumn.name,
    };

    relationships.push(relationship);
  });

  return relationships;
}
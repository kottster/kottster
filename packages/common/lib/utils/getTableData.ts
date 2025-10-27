import { defaultTablePageSize } from "../constants/table";
import { RelationalDatabaseSchema, RelationalDatabaseSchemaTable } from "../models/databaseSchema.model";
import { TablePageConfig, TablePageConfigColumn } from "../models/tablePage.model";
import { findNameLikeColumns } from "./findNameLikeColumns";
import { getAllPossibleRelationships } from "./getAllPossibleRelationships";
import { getLabelFromForeignKeyColumnName } from "./getLabelFromForeignKeyColumnName";
import { transformToReadable } from "./transformToReadable";

interface ReturnTypeFinalData extends TablePageConfig {
  selectableColumns: string[];
  searchableColumns: string[];
  sortableColumns: string[];
  filterableColumns: string[];
  hiddenColumns: string[];
  hiddenLinkedRecordsColumns: string[];
}

interface ReturnType {
  tableSchema?: RelationalDatabaseSchemaTable; 
  tablePageProcessedConfig: ReturnTypeFinalData;
}

/**
 * Get the default column data for a given table and column name.
 * This function uses the database schema to determine the default settings for the column.
 */
export function getDefaultColumnData(
  tableName: string, 
  columnName: string, 
  databaseSchema: RelationalDatabaseSchema
): TablePageConfigColumn {
  const tableSchema = databaseSchema?.tables.find(t => t.name === tableName);
  if (!tableSchema) {
    throw new Error(`Table ${tableName} not found in database schema`);
  }

  const columnSchema = tableSchema.columns.find(c => c.name === columnName);
  if (!columnSchema) {
    throw new Error(`Column ${columnName} not found in table ${tableName}`);
  }

  const foreignTableSchema = columnSchema.foreignKey && databaseSchema.tables.find(t => t.name === columnSchema.foreignKey?.table);
  const relationshipPreviewColumns = foreignTableSchema ? findNameLikeColumns(foreignTableSchema.columns) : [];
  
  return {
    column: columnName,
    label: columnSchema.foreignKey ? getLabelFromForeignKeyColumnName(columnSchema.name) : transformToReadable(columnSchema.name),
    hiddenInTable: false,
    hiddenInForm: columnSchema.primaryKey?.autoIncrement ? true : false,
    filterable: true,
    sortable: (columnSchema.contentHint && ['number', 'boolean', 'date'].includes(columnSchema.contentHint)) || false,
    searchable: (!columnSchema.foreignKey && columnSchema.contentHint === 'string') || false,
    relationshipPreviewColumns,
    fieldInput: columnSchema.fieldInput,
    fieldRequirement: columnSchema.nullable ? 'none' : 'notEmpty',
    formFieldSpan: '12',
  };
}

export function getTableData(params: {
  tablePageConfig?: TablePageConfig;
  databaseSchema?: RelationalDatabaseSchema;
}): ReturnType {
  const emptyData: ReturnType = {
    tablePageProcessedConfig: {
      dataSource: '',
      fetchStrategy: 'databaseTable',
      selectableColumns: [],
      searchableColumns: [],
      sortableColumns: [],
      filterableColumns: [],
      hiddenColumns: [],
      hiddenLinkedRecordsColumns: [],
    },
  };

  const { tablePageConfig, databaseSchema } = params;
  if (!tablePageConfig) {
    return emptyData;
  };

  // Table schema
  const tableSchema = tablePageConfig.table ? databaseSchema?.tables.find((t) => t.name === tablePageConfig.table) : undefined;
  if (tablePageConfig.table && !tableSchema) {
    return emptyData;
  };

  const primaryKeyColumn = tablePageConfig?.primaryKeyColumn ?? tableSchema?.columns.filter(c => c.primaryKey)[0]?.name;
  
  // Allow CRUD only if table is defined
  const allowInsert = tablePageConfig.table ? (tablePageConfig?.allowInsert ?? true) : false;
  const allowUpdate = tablePageConfig.table ? (tablePageConfig?.allowUpdate ?? true) : false;
  const allowDelete = tablePageConfig.table ? (tablePageConfig?.allowDelete ?? true) : false;

  // Get columns based on table schema or table page config
  const columns = tableSchema ? tableSchema.columns.map(c => {
    const column = tablePageConfig?.columns?.find(c2 => c2.column === c.name);
    const defaultColumnData = getDefaultColumnData(
      tablePageConfig.table!,
      c.name, 
      databaseSchema!,
    );

    return {
      column: c.name,
      label: column?.label ?? defaultColumnData.label,
      hiddenInTable: column?.hiddenInTable ?? defaultColumnData.hiddenInTable,
      hiddenInForm: column?.hiddenInForm ?? defaultColumnData.hiddenInForm,
      filterable: column?.filterable ?? defaultColumnData.filterable,
      sortable: column?.sortable ?? defaultColumnData.sortable,
      searchable: column?.searchable ?? defaultColumnData.searchable,
      prefix: column?.prefix ?? defaultColumnData.prefix,
      suffix: column?.suffix ?? defaultColumnData.suffix,
      position: column?.position ?? defaultColumnData.position,
      formFieldPosition: column?.formFieldPosition ?? defaultColumnData.formFieldPosition,
      relationshipPreviewColumns: column?.relationshipPreviewColumns ?? defaultColumnData.relationshipPreviewColumns,
      fieldInput: column?.fieldInput ?? defaultColumnData.fieldInput,
      fieldRequirement: column?.fieldRequirement ?? defaultColumnData.fieldRequirement,
      formFieldSpan: column?.formFieldSpan ?? defaultColumnData.formFieldSpan,
    } as TablePageConfigColumn;
  }) : tablePageConfig.columns;

  const selectableColumns = columns?.map(c => c.column) ?? [];
  const searchableColumns = columns?.filter(c => c.searchable).map(c => c.column) ?? [];
  const sortableColumns = columns?.filter(c => c.sortable).map(c => c.column) ?? [];
  const filterableColumns = columns?.filter(c => c.filterable).map(c => c.column) ?? [];
  const hiddenColumns = columns?.filter(c => c.hiddenInTable).map(c => c.column) ?? [];

  // Relationships
  const relationships = (databaseSchema && getAllPossibleRelationships(tablePageConfig, databaseSchema)) ?? [];

  // Linked-records columns
  const linkedRecordsColumns = relationships ? relationships.filter(r => r.relation === 'oneToMany').map(r => {
    const linkedRecordsColumn = tablePageConfig?.linkedRecordsColumns?.find(lrc => lrc.relationshipKey === r.key);
    const defaultLinkedRecordsColumnData = {
      relationshipKey: r.key,
      label: r.relation === 'oneToOne' ? getLabelFromForeignKeyColumnName(r.foreignKeyColumn || '') : transformToReadable(r.targetTable || ''),
      hiddenInTable: false,
    };

    return {
      relationshipKey: r.key,
      label: linkedRecordsColumn?.label ?? defaultLinkedRecordsColumnData.label,
      hiddenInTable: linkedRecordsColumn?.hiddenInTable ?? defaultLinkedRecordsColumnData.hiddenInTable,
      position: linkedRecordsColumn?.position ?? undefined,
    };
  }) : tablePageConfig.linkedRecordsColumns;
  const hiddenLinkedRecordsColumns = linkedRecordsColumns?.filter(lrc => lrc.hiddenInTable).map(lrc => lrc.relationshipKey) ?? [];

  return {
    tableSchema,
    tablePageProcessedConfig: {
      dataSource: tablePageConfig.dataSource,
      fetchStrategy: tablePageConfig.fetchStrategy,

      table: tablePageConfig.table,
      primaryKeyColumn,
      
      columns,
      
      selectableColumns,
      searchableColumns,
      sortableColumns,
      filterableColumns,
      hiddenColumns,
      
      calculatedColumns: tablePageConfig.calculatedColumns,

      linkedRecordsColumns,
      hiddenLinkedRecordsColumns,
      
      relationships,
  
      allowInsert,
      allowedRolesToInsert: tablePageConfig.allowedRolesToInsert,
      allowUpdate,
      allowedRolesToUpdate: tablePageConfig.allowedRolesToUpdate,
      allowDelete,
      allowedRolesToDelete: tablePageConfig.allowedRolesToDelete,

      pageSize: tablePageConfig?.pageSize ?? defaultTablePageSize,

      defaultSortColumn: tablePageConfig?.defaultSortColumn ?? primaryKeyColumn,
      defaultSortDirection: tablePageConfig?.defaultSortDirection ?? 'desc',

      views: tablePageConfig?.views || [],

      // Deprecated values replaced by allowedRoles fields
      allowedRoleIdsToInsert: tablePageConfig?.allowedRoleIdsToInsert,
      allowedRoleIdsToUpdate: tablePageConfig?.allowedRoleIdsToUpdate,
      allowedRoleIdsToDelete: tablePageConfig?.allowedRoleIdsToDelete,
    },
  };
}

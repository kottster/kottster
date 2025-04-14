import { defaultTablePageSize } from "../constants/table";
import { RelationalDatabaseSchema, RelationalDatabaseSchemaTable } from "../models/databaseSchema.model";
import { Relationship, TablePageConfig, TablePageConfigColumn } from "../models/tablePage.model";
import { findNameLikeColumns } from "./findNameLikeColumns";
import { getAllPossibleRelationships } from "./getAllPossibleLinked";
import { getLabelFromForeignKeyColumnName } from "./getLabelFromForeignKeyColumnName";
import { sortColumnsByPriority } from "./sortColumnsByPriority";
import { sortRelationshipsByOrder } from "./sortRelationshipsByOrder";
import { transformToReadable } from "./transformToReadable";

interface ReturnTypeFinalData extends TablePageConfig {
  // Columns
  selectableColumns: string[];
  searchableColumns: string[];
  sortableColumns: string[];
  filterableColumns: string[];
  hiddenColumns: string[];

  // Relationships
  hiddenRelationships: string[];
}
interface ReturnType {
  tableSchema?: RelationalDatabaseSchemaTable; 
  tablePageProcessedConfig: ReturnTypeFinalData;
}

const emptyData: ReturnType = {
  tablePageProcessedConfig: {
    selectableColumns: [],
    searchableColumns: [],
    sortableColumns: [],
    filterableColumns: [],
    hiddenColumns: [],
    hiddenRelationships: [],
  },
};

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
    column: columnSchema.name,
    label: columnSchema.foreignKey ? getLabelFromForeignKeyColumnName(columnSchema.name) : transformToReadable(columnSchema.name),
    hidden: false,
    filterable: true,
    sortable: (columnSchema.contentHint && ['number', 'boolean', 'date'].includes(columnSchema.contentHint)) || false,
    searchable: (!columnSchema.foreignKey && columnSchema.contentHint === 'string') || false,
    relationshipPreviewColumns,
    formField: columnSchema.formField,
    formFieldRequirement: columnSchema.nullable ? 'none' : 'notEmpty',
    formFieldSpan: '12',
  };
}

export function removeDefaultColumnData(data: TablePageConfigColumn, defaultColumnData: TablePageConfigColumn): TablePageConfigColumn | undefined {
  // If some data equal to defaultColumnData, remove it from finalData
  const finalData: Partial<Omit<TablePageConfigColumn, 'column'>> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'column') return;
    
    const typedKey = key as keyof Omit<TablePageConfigColumn, 'column'>;
    
    if (value !== undefined && value !== defaultColumnData[typedKey]) {
      finalData[typedKey] = value;
    }
  });

  // If finalData is empty, return undefined
  // Otherwise, return finalData with column name
  return Object.keys(finalData).length === 0 ? undefined : {
    ...finalData,
    column: data.column,
  };
}

export function getTableData(params: {
  tablePageConfig?: TablePageConfig;
  databaseSchema?: RelationalDatabaseSchema;
}): ReturnType {
  const { tablePageConfig, databaseSchema } = params;
  if (!tablePageConfig || !tablePageConfig.table || !databaseSchema) {
    return emptyData;
  };

  // Table schema
  const tableSchema = databaseSchema?.tables.find((t) => t.name === tablePageConfig.table);
  if (!tableSchema) {
    return emptyData;
  };

  const primaryKeyColumn = tablePageConfig?.primaryKeyColumn ?? tableSchema?.columns.filter(c => c.primaryKey)[0]?.name;
  const allowInsert = tablePageConfig?.allowInsert ?? true;
  const allowUpdate = tablePageConfig?.allowUpdate ?? true;
  const allowDelete = tablePageConfig?.allowDelete ?? true;

  // Columns
  const columns = tableSchema.columns.map(c => {
    const column = tablePageConfig?.columns?.find(c2 => c2.column === c.name);
    const defaultColumnData = getDefaultColumnData(
      tablePageConfig.table!,
      c.name, 
      databaseSchema,
    );

    return {
      column: c.name,
      label: column?.label ?? defaultColumnData.label,
      hidden: column?.hidden ?? defaultColumnData.hidden,
      filterable: column?.filterable ?? defaultColumnData.filterable,
      sortable: column?.sortable ?? defaultColumnData.sortable,
      searchable: column?.searchable ?? defaultColumnData.searchable,
      prefix: column?.prefix ?? defaultColumnData.prefix,
      suffix: column?.suffix ?? defaultColumnData.suffix,
      position: column?.position ?? defaultColumnData.position,
      relationshipPreviewColumns: column?.relationshipPreviewColumns ?? defaultColumnData.relationshipPreviewColumns,
      formField: column?.formField ?? defaultColumnData.formField,
      formFieldRequirement: column?.formFieldRequirement ?? defaultColumnData.formFieldRequirement,
      formFieldSpan: column?.formFieldSpan ?? defaultColumnData.formFieldSpan,
    } as TablePageConfigColumn;
  });
  const sortedColumns = sortColumnsByPriority(tableSchema?.columns, columns);
  const selectableColumns = columns?.map(c => c.column) ?? [];
  const searchableColumns = columns?.filter(c => c.searchable).map(c => c.column) ?? [];
  const sortableColumns = columns?.filter(c => c.sortable).map(c => c.column) ?? [];
  const filterableColumns = columns?.filter(c => c.filterable).map(c => c.column) ?? [];
  const hiddenColumns = columns?.filter(c => c.hidden).map(c => c.column) ?? [];

  // Relationships
  const autoDetectedRelationships = getAllPossibleRelationships(tablePageConfig, databaseSchema) ?? [];
  const relationships = autoDetectedRelationships.map(i => {
    const relationship = tablePageConfig?.relationships?.find(i2 => i2.key === i.key);

    return {
      ...i,
      key: i.key,
      hidden: relationship?.hidden ?? false,
      position: relationship?.position ?? i.position,
    } as Relationship;
  });
  const sortedRelationships = sortRelationshipsByOrder(relationships);
  const hiddenRelationships = relationships?.filter(i => i.hidden).map(i => i.key) ?? [];
  
  return {
    tableSchema,
    tablePageProcessedConfig: {
      table: tablePageConfig.table,
      primaryKeyColumn,
      
      columns: sortedColumns,
      selectableColumns,
      searchableColumns,
      sortableColumns,
      filterableColumns,
      hiddenColumns,
      
      relationships: sortedRelationships,
      hiddenRelationships,
  
      allowInsert,
      allowUpdate,
      allowDelete,
  
      pageSize: tablePageConfig?.pageSize ?? defaultTablePageSize,
    },
  };
}

import { RelationalDatabaseSchema, RelationalDatabaseSchemaTable } from "../models/databaseSchema.model";
import { LinkedItem, TableRpc } from "../models/tableRpc.model";
import { getAllPossibleLinked } from "./getAllPossibleLinked";
import { sortColumnsByPriority } from "./sortColumnsByPriority";
import { sortLinkedKeysByOrder } from "./sortLinkedByOrder";

interface TableData {
  tableSchema?: RelationalDatabaseSchemaTable;
  sortedTableSchemaColumns: RelationalDatabaseSchemaTable['columns'];
  formSortedTableSchemaColumns: RelationalDatabaseSchemaTable['columns'];

  linked?: TableRpc['linked'];

  primaryKeyColumn?: string;

  allowInsert: boolean;
  allowUpdate: boolean;
  allowDelete: boolean;

  hiddenColumns: string[];
  formHiddenColumns: string[];
  searchableColumns: string[];
  sortableColumns: string[];
  filterableColumns: string[];
  
  sortedLinkedItemKeys: string[];
  sortedLinkedItemsWithKeys: (LinkedItem & { key: string; })[];
}

const emptyData: TableData = {
  sortedTableSchemaColumns: [],
  formSortedTableSchemaColumns: [],
  primaryKeyColumn: undefined,
  allowInsert: false,
  allowUpdate: false,
  allowDelete: false,
  hiddenColumns: [],
  formHiddenColumns: [],
  searchableColumns: [],
  sortableColumns: [],
  filterableColumns: [],
  sortedLinkedItemKeys: [],
  sortedLinkedItemsWithKeys: [],
};

export function getTableData(params: {
  tableRpc?: TableRpc;
  databaseSchema?: RelationalDatabaseSchema;
}): TableData {
  const { tableRpc, databaseSchema } = params;
  if (!tableRpc || !databaseSchema) {
    return emptyData;
  };

  const tableSchema = databaseSchema?.tables.find((t) => t.name === tableRpc.table);
  const linked = !tableRpc.linked ? getAllPossibleLinked(tableRpc, databaseSchema) : undefined;
  
  const sortedTableSchemaColumns = sortColumnsByPriority(tableSchema?.columns ?? [], tableRpc.columnsOrder);
  const sortedLinkedItemKeys = linked ? sortLinkedKeysByOrder(Object.keys(linked), tableRpc.linkedItemsOrder) : [];
  const sortedLinkedItemsWithKeys = linked ? sortedLinkedItemKeys.map(key => ({ ...linked[key], key })) : [];

  const formSortedTableSchemaColumns = sortColumnsByPriority(tableSchema?.columns ?? [], tableRpc.formColumnsOrder);

  const hiddenColumns = tableRpc?.hiddenColumns ?? [];
  const formHiddenColumns = tableRpc?.formHiddenColumns ?? sortedTableSchemaColumns.filter(c => c.primaryKey).map(c => c.name);
  const filterableColumns = tableRpc?.filterableColumns ?? sortedTableSchemaColumns?.map(c => c.name);
  const sortableColumns = tableRpc?.sortableColumns ?? sortedTableSchemaColumns?.filter((column) => column.contentHint && ['number', 'boolean', 'date'].includes(column.contentHint)).map(c => c.name);
  const searchableColumns = tableRpc?.searchableColumns ?? sortedTableSchemaColumns?.filter((column) => !column.foreignKey && column.contentHint === 'string').map(c => c.name);

  const primaryKeyColumn = tableRpc?.primaryKeyColumn ?? sortedTableSchemaColumns.filter(c => c.primaryKey)[0]?.name;
  const allowInsert = tableRpc?.allowInsert ?? true;
  const allowUpdate = tableRpc?.allowUpdate ?? true;
  const allowDelete = tableRpc?.allowDelete ?? true;

  if (!tableSchema) {
    return emptyData;
  };
  
  return {
    tableSchema,
    sortedLinkedItemKeys,
    formSortedTableSchemaColumns,
    sortedTableSchemaColumns,
    sortedLinkedItemsWithKeys,
    primaryKeyColumn,
    allowInsert,
    allowUpdate,
    allowDelete,
    hiddenColumns,
    formHiddenColumns,
    searchableColumns,
    sortableColumns,
    filterableColumns,
    linked: tableRpc.linked ?? linked,
  };
}

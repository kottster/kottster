import { RelationalDatabaseSchemaColumn } from "../models/databaseSchema.model";

/**
 * Finds columns that are likely to contain names
 * @param columns The columns to search
 * @returns The names of the columns that are likely to contain names
 */
export function findNameLikeColumns(columns: RelationalDatabaseSchemaColumn[]): string[] {
  const nameLikeColumnNames = [
    'name',
    'title',
    'first_name',
    'last_name',
    'username',
    'login',
    'subject',
    'full_name',
    'display_name',
    'nickname',
    'email',
    'contact',
    'label',
    'caption',
    'description',
    'info',
    'details',
    'summary',
    'alias',
    'handle',
    'screen_name',
    'profile_name',
    'given_name',
    'family_name',
    'initials',
    'maiden_name',
    'middle_name',
    'company',
    'organization',
  ];
  const possibleColumns = columns.filter((column) => !column.primaryKey && !column.foreignKey && !column.enumValues);

  let nameLikeColumns = possibleColumns.filter((column) => nameLikeColumnNames.includes(column.name)).map((column) => column.name);
  if (nameLikeColumns.length === 0) {
    nameLikeColumns = possibleColumns.filter((column) => nameLikeColumns.includes(column.name)).map((column) => column.name);
  }

  nameLikeColumns = nameLikeColumns.slice(0, 1);

  return nameLikeColumns;
}
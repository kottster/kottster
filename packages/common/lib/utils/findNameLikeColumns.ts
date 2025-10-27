import { RelationalDatabaseSchemaColumn } from "../models/databaseSchema.model";

/**
 * Finds columns that are likely to contain names
 * @param columns The columns to search
 * @returns The names of the columns that are likely to contain names (sorted by likeness)
 */
export function findNameLikeColumns(columns: RelationalDatabaseSchemaColumn[], max: number = 1): string[] {
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
  
  // Filter out columns that shouldn't be used as names
  const possibleColumns = columns.filter((column) => !column.primaryKey && !column.foreignKey && !column.enumValues);

  // Find columns that match name-like patterns
  let nameLikeColumns = possibleColumns.filter((column) => 
    nameLikeColumnNames.includes(column.name.toLowerCase())
  );
  
  // If no exact matches, look for columns that contain name-like patterns
  if (nameLikeColumns.length === 0) {
    nameLikeColumns = possibleColumns.filter((column) => 
      nameLikeColumnNames.some(pattern => column.name.toLowerCase().includes(pattern))
    );
  }

  // Sort by likeness (index in nameLikeColumnNames array defines priority)
  nameLikeColumns.sort((a, b) => {
    const aIndex = nameLikeColumnNames.findIndex(pattern => 
      a.name.toLowerCase() === pattern || a.name.toLowerCase().includes(pattern)
    );
    const bIndex = nameLikeColumnNames.findIndex(pattern => 
      b.name.toLowerCase() === pattern || b.name.toLowerCase().includes(pattern)
    );
    return aIndex - bIndex;
  });

  // Return only the column names, limited by max
  return nameLikeColumns.slice(0, max).map((column) => column.name);
}
export interface RelationalDatabaseSchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  enumValues?: string; // Optional property with enum values separated by commas, e.g. 'value1,value2,value3'
}

// Schema for a relational database
export interface RelationalDatabaseSchema {
  name: string;
  tables: {
    name: string;
    columns: RelationalDatabaseSchemaColumn[];
  }[];
}

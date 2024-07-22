export interface DatabaseSchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  enumValues?: string; // Optional property with enum values separated by commas, e.g. 'value1,value2,value3'
}

export interface DatabaseSchema {
  name: string;
  tables: {
    name: string;
    columns: DatabaseSchemaColumn[];
  }[];
}

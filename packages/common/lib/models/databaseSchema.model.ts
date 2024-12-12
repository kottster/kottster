import { FormField } from "./formField.model";
import { JsType } from "./js.model";

export interface RelationalDatabaseSchemaColumn {
  name: string;
  type: string;
  fullType: string;

  /** If true, the column is an array */
  isArray?: boolean;
  formField?: FormField;
  returnedJsType?: keyof typeof JsType;
  /** If true, the column is returned as an array of JsType values */
  returnedAsArray?: boolean;
  nullable: boolean;
  /** Enum values separated by commas, e.g. 'value1,value2,value3' */
  enumValues?: string;
  primaryKey?: {
    autoIncrement: boolean;
  };
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface RelationalDatabaseSchemaTable {
  name: string;
  columns: RelationalDatabaseSchemaColumn[];
}

// Schema for a relational database
export interface RelationalDatabaseSchema {
  name: string;
  tables: RelationalDatabaseSchemaTable[];
}

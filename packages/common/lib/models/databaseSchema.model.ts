import { ContentHint } from "./contentHint.model";
import { FieldInput } from "./fieldInput.model";
import { JsType } from "./js.model";

export interface RelationalDatabaseSchemaColumn {
  name: string;
  type: string;
  fullType: string;

  fieldInput?: FieldInput;
  returnedJsType?: keyof typeof JsType;

  /** If true, the column is an array */
  isArray?: boolean;
  
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

  contentHint?: keyof typeof ContentHint;
}

export interface RelationalDatabaseSchemaTable {
  name: string;
  columns: RelationalDatabaseSchemaColumn[];
}

export interface RelationalDatabaseSchema {
  name: string;
  tables: RelationalDatabaseSchemaTable[];
}

import { ContentHint, JsType } from "../models/databaseSchema.model";

export enum SqliteBaseType {
  int = "int",
  integer = "integer",
  tinyint = "tinyint",
  smallint = "smallint",
  mediumint = "mediumint",
  bigint = "bigint",
  unsigned_big_int = "unsigned big int",
  int2 = "int2",
  int8 = "int8",
  character = "character",
  varchar = "varchar",
  varying_character = "varying character",
  nchar = "nchar",
  native_character = "native character",
  nvarchar = "nvarchar",
  text = "text",
  clob = "clob",
  blob = "blob",
  real = "real",
  double = "double",
  double_precision = "double precision",
  float = "float",
  numeric = "numeric",
  decimal = "decimal",
  boolean = "boolean",
  date = "date",
  datetime = "datetime",
};

export const sqliteBaseTypeToJsType: Record<keyof typeof SqliteBaseType, keyof typeof JsType> = {
  int: 'number',
  integer: 'number',
  tinyint: 'number',
  smallint: 'number',
  mediumint: 'number',
  bigint: 'number',
  unsigned_big_int: 'number',
  int2: 'number',
  int8: 'number',
  character: 'string',
  varchar: 'string',
  varying_character: 'string',
  nchar: 'string',
  native_character: 'string',
  nvarchar: 'string',
  text: 'string',
  clob: 'string',
  blob: 'string',
  real: 'number',
  double: 'number',
  double_precision: 'number',
  float: 'number',
  numeric: 'number',
  decimal: 'number',
  boolean: 'number',
  date: 'string',
  datetime: 'string'
};

export const sqliteBaseTypesByContentHint: Record<keyof typeof ContentHint, SqliteBaseType[]> = {
  string: [
    SqliteBaseType.character, 
    SqliteBaseType.varchar, 
    SqliteBaseType.varying_character, 
    SqliteBaseType.nchar, 
    SqliteBaseType.native_character, 
    SqliteBaseType.nvarchar, 
    SqliteBaseType.text, 
    SqliteBaseType.clob
  ],
  number: [
    SqliteBaseType.int, 
    SqliteBaseType.integer, 
    SqliteBaseType.tinyint, 
    SqliteBaseType.smallint, 
    SqliteBaseType.mediumint, 
    SqliteBaseType.bigint, 
    SqliteBaseType.unsigned_big_int, 
    SqliteBaseType.int2, 
    SqliteBaseType.int8, 
    SqliteBaseType.numeric, 
    SqliteBaseType.decimal, 
    SqliteBaseType.boolean
  ],
  boolean: [
    SqliteBaseType.boolean
  ],
  date: [
    SqliteBaseType.date, 
    SqliteBaseType.datetime
  ],
};
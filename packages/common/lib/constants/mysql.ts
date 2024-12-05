import { JsType } from "../models/js.model"

export enum MysqlBaseType {
  bigint = "bigint",
  blob = "blob",
  char = "char",
  datetime = "datetime",
  decimal = "decimal",
  double = "double",
  enum = "enum",
  float = "float",
  int = "int",
  json = "json",
  longblob = "longblob",
  longtext = "longtext",
  mediumblob = "mediumblob",
  mediumint = "mediumint", 
  mediumtext = "mediumtext",
  smallint = "smallint",
  text = "text",
  time = "time",
  timestamp = "timestamp",
  tinyint = "tinyint",
  varbinary = "varbinary",
  varchar = "varchar",
};

export const mysqlBaseTypeToJsType: Record<keyof typeof MysqlBaseType, keyof typeof JsType> = {
  bigint: 'number',
  blob: 'buffer',
  char: 'string',
  datetime: 'date',
  decimal: 'string',
  double: 'number',
  float: 'number',
  int: 'number',
  json: 'object',
  longblob: 'buffer',
  longtext: 'string',
  mediumblob: 'buffer',
  mediumint: 'number',
  mediumtext: 'string',
  smallint: 'number',
  text: 'string',
  time: 'date',
  timestamp: 'date',
  tinyint: 'number',
  varbinary: 'buffer',
  varchar: 'string',
  enum: 'string'
};

// export const mysqlBaseTypeToArrayReturn: Record<keyof typeof MysqlBaseType, boolean> = {

// };

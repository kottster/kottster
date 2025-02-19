import { ContentHint } from "../models/contentHint.model";
import { JsType } from "../models/js.model"

export enum MysqlBaseType {
  int = "int",
  bigint = "bigint",
  blob = "blob",
  char = "char",
  datetime = "datetime",
  decimal = "decimal",
  double = "double",
  float = "float",
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
  enum = "enum",
  binary = "binary",
  date = "date",
  tinyblob = "tinyblob",
  tinytext = "tinytext",
  year = "year",
  json = "json",
};

export const mysqlBaseTypeToJsType: Record<keyof typeof MysqlBaseType, keyof typeof JsType> = {
  bigint: 'number',
  blob: 'buffer',
  char: 'string',
  datetime: 'date',
  decimal: 'string',
  double: 'number',
  float: 'number',
  longblob: 'buffer',
  longtext: 'string',
  mediumblob: 'buffer',
  mediumint: 'number',
  mediumtext: 'string',
  smallint: 'number',
  text: 'string',
  time: 'string',
  timestamp: 'date',
  tinyint: 'number',
  varbinary: 'buffer',
  varchar: 'string',
  enum: 'string',
  binary: 'buffer',
  date: 'date',
  tinyblob: 'buffer',
  tinytext: 'string',
  year: 'number',
  json: 'object',
  int: 'number'
};

export const mysqlBaseTypesByContentHint: Record<keyof typeof ContentHint, MysqlBaseType[]> = {
  string: [
    MysqlBaseType.char, 
    MysqlBaseType.varchar, 
    MysqlBaseType.text, 
    MysqlBaseType.longtext, 
    MysqlBaseType.mediumtext, 
    MysqlBaseType.tinytext
  ],
  number: [
    MysqlBaseType.tinyint, 
    MysqlBaseType.smallint, 
    MysqlBaseType.mediumint, 
    MysqlBaseType.int, 
    MysqlBaseType.bigint, 
    MysqlBaseType.float, 
    MysqlBaseType.double, 
    MysqlBaseType.decimal
  ],
  boolean: [
    MysqlBaseType.tinyint
  ],
  date: [
    MysqlBaseType.time, 
    MysqlBaseType.date, 
    MysqlBaseType.datetime, 
    MysqlBaseType.timestamp
  ],
};
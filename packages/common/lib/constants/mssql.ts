import { ContentHint } from "../models/contentHint.model";
import { JsType } from "../models/js.model"

export enum MssqlBaseType {
  varchar = 'varchar',
  nvarchar = 'nvarchar',
  char = 'char',
  nchar = 'nchar',
  text = 'text',
  ntext = 'ntext',
  tinyint = 'tinyint',
  smallint = 'smallint',
  int = 'int',
  bigint = 'bigint',
  bit = 'bit',
  decimal = 'decimal',
  numeric = 'numeric',
  money = 'money',
  smallmoney = 'smallmoney',
  real = 'real',
  float = 'float',
  date = 'date',
  time = 'time',
  datetime = 'datetime',
  datetime2 = 'datetime2',
  smalldatetime = 'smalldatetime',
  datetimeoffset = 'datetimeoffset',
  binary = 'binary',
  varbinary = 'varbinary',
  image = 'image',
  uniqueidentifier = 'uniqueidentifier',
  xml = 'xml'
};

export const mssqlBaseTypeToJsType: Record<keyof typeof MssqlBaseType, keyof typeof JsType> = {
  varchar: 'string',
  nvarchar: 'string',
  char: 'string',
  nchar: 'string',
  text: 'string',
  ntext: 'string',
  tinyint: 'number',
  smallint: 'number',
  int: 'number',
  bigint: 'string',
  bit: 'boolean',
  decimal: 'number',
  numeric: 'number',
  money: 'number',
  smallmoney: 'number',
  real: 'number',
  float: 'number',
  date: 'date',
  time: 'date',
  datetime: 'date',
  datetime2: 'date',
  smalldatetime: 'date',
  datetimeoffset: 'date',
  binary: 'buffer',
  varbinary: 'buffer',
  image: 'buffer',
  uniqueidentifier: 'string',
  xml: 'string'
};

export const mssqlBaseTypesByContentHint: Record<keyof typeof ContentHint, MssqlBaseType[]> = {
  string: [
    MssqlBaseType.varchar,
    MssqlBaseType.nvarchar,
    MssqlBaseType.char,
    MssqlBaseType.nchar,
    MssqlBaseType.text,
    MssqlBaseType.ntext,
    MssqlBaseType.bigint,
    MssqlBaseType.uniqueidentifier,
    MssqlBaseType.xml
  ],
  number: [
    MssqlBaseType.tinyint,
    MssqlBaseType.smallint,
    MssqlBaseType.int,
    MssqlBaseType.decimal,
    MssqlBaseType.numeric,
    MssqlBaseType.money,
    MssqlBaseType.smallmoney,
    MssqlBaseType.real,
    MssqlBaseType.float,
    MssqlBaseType.bit
  ],
  boolean: [
    MssqlBaseType.bit
  ],
  date: [
    MssqlBaseType.date,
    MssqlBaseType.time,
    MssqlBaseType.datetime,
    MssqlBaseType.datetime2,
    MssqlBaseType.smalldatetime,
    MssqlBaseType.datetimeoffset
  ],
};
import { StatRPCInputSelect, StatRPCInputSpec } from "./statRpc.model";
import { TableRPCInputDelete, TableRPCInputInsert, TableRPCInputSelect, TableRPCInputSelectLinkedRecords, TableRPCInputSpec, TableRPCInputUpdate } from "./tableRpc.model";

export type RPCActionType = 'table_spec' | 'table_select' | 'table_selectLinkedRecords' | 'table_insert' | 'table_update' | 'table_delete' | 'stat_spec' | 'stat_select';

export interface RPCActionBody<T extends RPCActionType> {
  [key: string]: any;
  action: T;
  input:
      T extends 'table_spec' ? TableRPCInputSpec 
    : T extends 'table_select' ? TableRPCInputSelect
    : T extends 'table_selectLinkedRecords' ? TableRPCInputSelectLinkedRecords
    : T extends 'table_insert' ? TableRPCInputInsert
    : T extends 'table_update' ? TableRPCInputUpdate
    : T extends 'table_delete' ? TableRPCInputDelete
    : T extends 'stat_spec' ? StatRPCInputSpec
    : T extends 'stat_select' ? StatRPCInputSelect
    : never;
}

export type InternalApiResponse = {
  status: 'success';
  result: any;
} | {
  status: 'error';
  error: any;
};

export type RPCResponse = {
  status: 'success';
  result: any;
} | {
  status: 'error';
  error: any;
};
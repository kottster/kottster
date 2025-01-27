import { StatRpcInputSelect, StatRpcInputSpec } from "./statRpc.model";
import { TableRpcInputDelete, TableRpcInputInsert, TableRpcInputSelect, TableRpcInputSelectLinkedRecords, TableRpcInputSpec, TableRpcInputUpdate } from "./tableRpc.model";

interface CustomRpcInput {
  procedure: string;
  procedureInput: any;
};

export type RPCActionType = 'custom' | 'table_spec' | 'table_select' | 'table_selectLinkedRecords' | 'table_insert' | 'table_update' | 'table_delete' | 'stat_spec' | 'stat_select';

export interface RPCActionBody<T extends RPCActionType> {
  [key: string]: any;
  action: T;
  input:
      T extends 'table_spec' ? TableRpcInputSpec 
    : T extends 'table_select' ? TableRpcInputSelect
    : T extends 'table_selectLinkedRecords' ? TableRpcInputSelectLinkedRecords
    : T extends 'table_insert' ? TableRpcInputInsert
    : T extends 'table_update' ? TableRpcInputUpdate
    : T extends 'table_delete' ? TableRpcInputDelete
    : T extends 'stat_spec' ? StatRpcInputSpec
    : T extends 'stat_select' ? StatRpcInputSelect
    : T extends 'custom' ? CustomRpcInput
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
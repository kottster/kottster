import { TablePageInputDelete, TablePageInputInsert, TablePageInputSelect, TablePageInputSelectSingle, TablePageInputUpdate } from "./tablePage.model";

interface CustomRpcInput {
  procedure: string;
  procedureInput: any;
};

export type RpcActionType = 'custom' | 'page_settings' | 'table_select' | 'table_selectOne' | 'table_insert' | 'table_update' | 'table_delete';

export interface RpcActionBody<T extends RpcActionType> {
  [key: string]: any;
  action: T;
  input:
      T extends 'page_settings' ? any 
    : T extends 'table_select' ? TablePageInputSelect
    : T extends 'table_selectOne' ? TablePageInputSelectSingle
    : T extends 'table_insert' ? TablePageInputInsert
    : T extends 'table_update' ? TablePageInputUpdate
    : T extends 'table_delete' ? TablePageInputDelete
    : T extends 'custom' ? CustomRpcInput
    : never;
}

export type ApiResponse = {
  status: 'success';
  result: any;
} | {
  status: 'error';
  error: any;
};

export type RpcResponse = {
  status: 'success';
  result: any;
} | {
  status: 'error';
  error: any;
};
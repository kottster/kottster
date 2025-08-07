import { DashboardPageInputGetCardData, DashboardPageInputGetStatData } from "./dashboardPage.model";
import { TablePageInputDelete, TablePageInputInsert, TablePageInputSelect, TablePageInputSelectSingle, TablePageInputUpdate } from "./tablePage.model";

interface CustomRpcInput {
  procedure: string;
  procedureInput: any;
};

export type RpcActionType = 'custom' | 'table_select' | 'table_selectOne' | 'table_insert' | 'table_update' | 'table_delete' | 'dashboard_getCardData' | 'dashboard_getStatData';

export interface RpcActionBody<T extends RpcActionType> {
  [key: string]: any;
  action: T;
  input:
      T extends 'table_select' ? TablePageInputSelect
    : T extends 'table_selectOne' ? TablePageInputSelectSingle
    : T extends 'table_insert' ? TablePageInputInsert
    : T extends 'table_update' ? TablePageInputUpdate
    : T extends 'table_delete' ? TablePageInputDelete
    : T extends 'dashboard_getStatData' ? DashboardPageInputGetStatData
    : T extends 'dashboard_getCardData' ? DashboardPageInputGetCardData
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
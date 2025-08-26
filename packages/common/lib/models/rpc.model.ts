import { DashboardPageGetCardDataInput, DashboardPageGetStatDataInput } from "./dashboardPage.model";
import { TablePageDeleteRecordInput, TablePageCreateRecordInput, TablePageGetRecordsInput, TablePageGetRecordInput, TablePageUpdateRecordInput } from "./tablePage.model";

interface CustomRpcInput {
  procedure: string;
  procedureInput: any;
};

export type RpcActionType = 'custom' | 'table_getRecords' | 'table_getRecord' | 'table_createRecord' | 'table_updateRecord' | 'table_deleteRecord' | 'dashboard_getCardData' | 'dashboard_getStatData';

export interface RpcActionBody<T extends RpcActionType> {
  [key: string]: any;
  action: T;
  input:
      T extends 'table_getRecords' ? TablePageGetRecordsInput
    : T extends 'table_getRecord' ? TablePageGetRecordInput
    : T extends 'table_createRecord' ? TablePageCreateRecordInput
    : T extends 'table_updateRecord' ? TablePageUpdateRecordInput
    : T extends 'table_deleteRecord' ? TablePageDeleteRecordInput
    : T extends 'dashboard_getStatData' ? DashboardPageGetStatDataInput
    : T extends 'dashboard_getCardData' ? DashboardPageGetCardDataInput
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
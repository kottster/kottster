import { DashboardPageGetCardDataInput, DashboardPageGetCardDataResult, DashboardPageGetStatDataInput, DashboardPageGetStatDataResult } from "./dashboardDto.model";
import { TablePageDeleteRecordInput, TablePageCreateRecordInput, TablePageGetRecordsInput, TablePageGetRecordInput, TablePageUpdateRecordInput, TablePageInitiateRecordsExportInput, TablePageGetRecordsResult, TablePageInitiateRecordsExportResult, TablePageGetRecordResult, TablePageCreateRecordResult, TablePageUpdateRecordResult } from "./tableDto.model";

export interface RpcSchema {
  // Table RPC
  table_getRecords: {
    input: TablePageGetRecordsInput;
    result: TablePageGetRecordsResult;
  };
  table_initiateRecordsExport: {
    input: TablePageInitiateRecordsExportInput;
    result: TablePageInitiateRecordsExportResult;
  };
  table_getRecord: {
    input: TablePageGetRecordInput;
    result: TablePageGetRecordResult;
  };
  table_createRecord: {
    input: TablePageCreateRecordInput;
    result: TablePageCreateRecordResult;
  };
  table_updateRecord: {
    input: TablePageUpdateRecordInput;
    result: TablePageUpdateRecordResult;
  };
  table_deleteRecord: {
    input: TablePageDeleteRecordInput;
    result: null;
  };
  
  // Dashboard RPC
  dashboard_getStatData: {
    input: DashboardPageGetStatDataInput;
    result: DashboardPageGetStatDataResult;
  };
  dashboard_getCardData: {
    input: DashboardPageGetCardDataInput;
    result: DashboardPageGetCardDataResult;
  };
  
  // Custom RPC
  custom: {
    input: {
      procedure: string;
      procedureInput: any;
    };
    result: unknown;
  };
}

export type RpcInput<T extends keyof RpcSchema> = RpcSchema[T]['input'];
export type RpcResult<T extends keyof RpcSchema> = RpcSchema[T]['result'];

export type RpcRequestBody = {
  [K in keyof RpcSchema]: {
    action: K;
    input: RpcInput<K>;
  }
}[keyof RpcSchema];

export type RpcResponse = {
  status: 'success';
  result: any;
} | {
  status: 'error';
  error: any;
};
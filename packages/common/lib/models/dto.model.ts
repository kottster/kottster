import { AppData } from "./appData.model";
import { DashboardPageConfig, DashboardPageConfigCard, DashboardPageConfigStat } from "./dashboardPage.model";
import { RelationalDatabaseSchema } from "./databaseSchema.model";
import { PublicDataSource } from "./dataSource.model";
import { Page, PageFileStructure } from "./page.model";
import { TablePageConfig } from "./tablePage.model";
import { Template } from "./template.model";
import { User } from "./user.model";

enum KottsterApiGenerateSqlPurpose {
  tableCustomSqlQuery = 'tableCustomSqlQuery',
  tableCustomSqlCountQuery = 'tableCustomSqlCountQuery',
  tableCalculatedColumnSqlQuery = 'tableCalculatedColumnSqlQuery',
  dashboardStatSqlQuery = 'dashboardStatSqlQuery',
  dashboardStatSqlTotalQuery = 'dashboardStatSqlTotalQuery',
  dashboardCardSqlQuery = 'dashboardCardSqlQuery',
}

export type KottsterApiGenerateSqlPurposeKeys = keyof typeof KottsterApiGenerateSqlPurpose;

export interface KottsterApiSchema {
  getAppData: {
    body: null;
    result: AppData;
  };

  getCurrentUser: {
    body: null;
    result: User;
  };

  generatePage: {
    body: {
      usingTsc: boolean;
      page: Page;
      params: (
        { type: 'tablePage'; } |
        { type: 'dashboardPage'; } |
        { type: 'defaultPage'; } | 
        { type: 'customPage'; template: string; }
      );
      databaseSchema?: RelationalDatabaseSchema;
    };
    result: PageFileStructure;
  };

  generateSql: {
    body: {
      request: string;
      dataSource: PublicDataSource;
      params: (
        { purpose: Extract<KottsterApiGenerateSqlPurposeKeys, 'tableCustomSqlQuery'>; tablePageConfig: TablePageConfig; tablePagePaginationEnabled: boolean; } |
        { purpose: Extract<KottsterApiGenerateSqlPurposeKeys, 'tableCustomSqlCountQuery'>; tablePageConfig: TablePageConfig; } |
        { purpose: Extract<KottsterApiGenerateSqlPurposeKeys, 'tableCalculatedColumnSqlQuery'>; tablePageConfig: TablePageConfig; } |
        { purpose: Extract<KottsterApiGenerateSqlPurposeKeys, 'dashboardStatSqlQuery'>; dashboardPageConfig: DashboardPageConfig; dashboardPageConfigStat: DashboardPageConfigStat; } |
        { purpose: Extract<KottsterApiGenerateSqlPurposeKeys, 'dashboardStatSqlTotalQuery'>; dashboardPageConfig: DashboardPageConfig; dashboardPageConfigStat: DashboardPageConfigStat; } |
        { purpose: Extract<KottsterApiGenerateSqlPurposeKeys, 'dashboardCardSqlQuery'>; dashboardPageConfig: DashboardPageConfig; dashboardPageConfigCard: DashboardPageConfigCard; }
      );
    };
    result: {
      sqlQuery: string;
      tablePageCustomSqlCountQuery?: string;
      tablePageCalculatedColumnAlias?: string;
      dashboardPageConfigStatSqlTotalQuery?: string;
      dashboardPageConfigCardValues?: string[];
      dashboardPageConfigCardDataKeyAlias?: string;
    };
  };

  getStorageValue: {
    body: null;
    result: string;
  }

  getTemplates: {
    body: null;
    result: Template[];
  },

  sendCliUsageData: {
    body: {
      command: string;
      stage: string;
      dateTime: string;
      platform: string;
      nodeVersion: string;
      duration: number;
      packageManager: string;
      usingTypescript: boolean;

      /**
       * @deprecated Not used anymore due to privacy concerns.
       */
      username: string;
    };
    result: null;
  },

  // TODO: legacy
  getSuggestions: {
    body: {
      userId: string | number;
      numberOfNavItems?: number;
      numberOfDataSources?: number;
      numberOfDatabaseTables?: number;
      path: string;
      isHostedOnLocalhost: boolean;
      isDevelopment: boolean;
      dockerMode: boolean;
      kottsterReactVersion: string;
    };
    result: {
      type: 'modal' | 'notification';
      shouldSeeOnlyOnce?: boolean;
      id: string;
      title: string; 
      message: string; 
      color: string; 
    }[];
  };
}

export type KottsterApiBody<T extends keyof KottsterApiSchema> = KottsterApiSchema[T]['body'];
export type KottsterApiResult<T extends keyof KottsterApiSchema> = KottsterApiSchema[T]['result'];
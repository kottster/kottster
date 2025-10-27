import { ClientAppSchema, MainJsonSchema, SidebarJsonSchema } from "./appSchema.model";
import { DashboardPageConfig, DashboardPageConfigCard, DashboardPageConfigStat } from "./dashboardPage.model";
import { RelationalDatabaseSchema } from "./databaseSchema.model";
import { DataSourceType, PublicDataSource } from "./dataSource.model";
import { Page, PageFileStructure } from "./page.model";
import { TablePageConfig } from "./tablePage.model";
import { Template } from "./template.model";
import { ClientIdentityProviderRole, ClientIdentityProviderUser, ClientIdentityProviderUserWithRoles, IdentityProviderUserPermission, User } from "./idp.model";

export interface InternalApiSchema {
  getUsers: {
    input: unknown;
    result: {
      users: ClientIdentityProviderUser[];
    };
  };

  createUser: {
    input: {
      user: Pick<ClientIdentityProviderUser, 'firstName' | 'email' | 'avatarUrl' | 'lastName' | 'username' | 'roleIds' | 'temporaryPassword'>;
      password: string;
    };
    result: {
      user: ClientIdentityProviderUser;
    };
  };

  updateUser: {
    input: {
      userId: ClientIdentityProviderUser['id'];
      user: Partial<ClientIdentityProviderUser>;
      newPassword?: string;
    };
    result: {
      user: ClientIdentityProviderUser;
    };
  };

  deleteUser: {
    input: {
      userId: ClientIdentityProviderUser['id'];
    };
    result: void;
  };

  createRole: {
    input: {
      role: Pick<ClientIdentityProviderRole, 'name' | 'permissions'>;
    };
    result: {
      role: ClientIdentityProviderRole;
    };
  };

  updateRole: {
    input: {
      roleId: ClientIdentityProviderRole['id'];
      role: Partial<ClientIdentityProviderRole>;
    };
    result: {
      role: ClientIdentityProviderRole;
    };
  };

  deleteRole: {
    input: {
      roleId: ClientIdentityProviderRole['id'];
    };
    result: void;
  };

  getApp: {
    input: unknown;
    result: {
      schema: ClientAppSchema; 

      // Pass only if user is authenticated
      user?: ClientIdentityProviderUserWithRoles;
      roles?: ClientIdentityProviderRole[];
      userPermissions?: (keyof typeof IdentityProviderUserPermission | string)[];
    };
  };

  generateSql: {
    input: {
      request: string;
      dataSourceName: string;
      params: (
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'tableCustomSqlQuery'>; tablePageConfig: TablePageConfig; tablePagePaginationEnabled: boolean; } |
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'tableCustomSqlCountQuery'>; tablePageConfig: TablePageConfig; } |
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'tableCalculatedColumnSqlQuery'>; tablePageConfig: TablePageConfig; } |
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'dashboardStatSqlQuery'>; dashboardPageConfig: DashboardPageConfig; dashboardPageConfigStat: DashboardPageConfigStat; } |
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'dashboardStatSqlTotalQuery'>; dashboardPageConfig: DashboardPageConfig; dashboardPageConfigStat: DashboardPageConfigStat; } |
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'dashboardCardSqlQuery'>; dashboardPageConfig: DashboardPageConfig; dashboardPageConfigCard: DashboardPageConfigCard; }
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

  login: {
    input: {
      usernameOrEmail: string;
      password: string;
      newPassword?: string;
    };
    result: {
      userJwtToken?: string;
      needsNewPassword?: boolean;
    };
  };

  changePassword: {
    input: {
      password: string;
      newPassword: string;
    };
    result: void;
  };

  logOutAllSessions: {
    input: {
      password: string;
    };
    result: void;
  };

  getDataSources: {
    input: {
      withSchema?: boolean;
    };
    result: PublicDataSource[];
  };

  getDataSourceSchema: {
    input: {
      name: string;
    };
    result: RelationalDatabaseSchema;
  };

  initApp: {
    input: {
      name: string;
      rootUsername: string;
      rootPassword: string;
    };
    result: {
      rootUserJwtToken: string;
    };
  };

  createPage: {
    input: {
      key: string;
      file?: PageFileStructure;
    };
    result: void;
  };

  updatePage: {
    input: {
      key: string;
      page: Page;
    };
    result: void;
  };

  deletePage: {
    input: {
      key: string;
    };
    result: void;
  };

  updateAppSchema: {
    input: {
      main?: MainJsonSchema;
      sidebar?: SidebarJsonSchema;
    };
    result: void;
  };

  addDataSource: {
    input: {
      type: DataSourceType;
      replaceDataSource?: string;
      connectionDetails: {
        connection: string | Record<string, any>;
        searchPath?: string[];
      };
      name?: string;
    };
    result: void;
  };

  removeDataSource: {
    input: {
      name: string;
    };
    result: void;
  };

  installPackagesForDataSource: {
    input: {
      type: DataSourceType;
    };
    result: void;
  };

  getProjectSettings: {
    input: unknown;
    result: {
      usingTsc: boolean;
      pagesWithDefinedIndexJsxFile: string[];
      pagesWithDefinedApiServerJsFile: string[];
    };
  };

  getKottsterContext: {
    input: unknown;
    result: {
      imposedLimits: {
        sqlGeneration?: number;
      };
      availableUpdate?: {
        critical: boolean;
        learnMoreUrl: string;
      };
    };
  };
}

export type InternalApiInput<T extends keyof InternalApiSchema> = InternalApiSchema[T]['input'];
export type InternalApiResult<T extends keyof InternalApiSchema> = InternalApiSchema[T]['result'];

enum InternalApiInputGenerateSqlPurpose {
  tableCustomSqlQuery = 'tableCustomSqlQuery',
  tableCustomSqlCountQuery = 'tableCustomSqlCountQuery',
  tableCalculatedColumnSqlQuery = 'tableCalculatedColumnSqlQuery',
  dashboardStatSqlQuery = 'dashboardStatSqlQuery',
  dashboardStatSqlTotalQuery = 'dashboardStatSqlTotalQuery',
  dashboardCardSqlQuery = 'dashboardCardSqlQuery',
}

export type InternalApiGenerateSqlPurposeKeys = keyof typeof InternalApiInputGenerateSqlPurpose;

export type InternalApiResponse<T> = {
  status: 'success';
  result: T;
} | {
  status: 'error';
  error: any;
};

/**
 * @deprecated Use InternalApiSchema instead
 */
export interface KottsterApiSchema {
  createApp: {
    input: unknown;
    result: {
      apiToken: string;
    };
  };

  sendCliUsageData: {
    input: {
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
  };
  
  getKottsterContext: {
    input: unknown;
    result: {
      imposedLimits: {
        sqlGeneration?: number;
      };
      availableUpdate?: {
        critical: boolean;
        learnMoreUrl: string;
      };
    };
  };

  generateSql: {
    input: {
      anonymousId?: string;
      request: string;
      dataSource: PublicDataSource;
      params: (
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'tableCustomSqlQuery'>; tablePageConfig: TablePageConfig; tablePagePaginationEnabled: boolean; } |
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'tableCustomSqlCountQuery'>; tablePageConfig: TablePageConfig; } |
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'tableCalculatedColumnSqlQuery'>; tablePageConfig: TablePageConfig; } |
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'dashboardStatSqlQuery'>; dashboardPageConfig: DashboardPageConfig; dashboardPageConfigStat: DashboardPageConfigStat; } |
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'dashboardStatSqlTotalQuery'>; dashboardPageConfig: DashboardPageConfig; dashboardPageConfigStat: DashboardPageConfigStat; } |
        { purpose: Extract<InternalApiGenerateSqlPurposeKeys, 'dashboardCardSqlQuery'>; dashboardPageConfig: DashboardPageConfig; dashboardPageConfigCard: DashboardPageConfigCard; }
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

  /** LEGACY - to be removed later */
  
  /**
   * @deprecated Legacy - to be removed later
   */
  getAppData: {
    input: null;
    result: {
      schema: ClientAppSchema; 
      roles: ClientIdentityProviderRole[];
      resources?: {
        videoTutorialUrl?: string;
        discordInviteUrl?: string;
      };

      // If user is authenticated
      user?: ClientIdentityProviderUser;
      userPermissions?: (keyof typeof IdentityProviderUserPermission | string)[];
    };
  };

  /**
   * @deprecated Legacy - to be removed later
   */
  getCurrentUser: {
    input: null;
    result: User;
  };

  /**
   * @deprecated Legacy - to be removed later
   */
  generatePage: {
    input: {
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

  /**
   * @deprecated Legacy - to be removed later
   */
  getStorageValue: {
    input: null;
    result: string;
  }

  /**
   * @deprecated Legacy - to be removed later
   */
  getTemplates: {
    input: null;
    result: Template[];
  },

  /**
   * @deprecated Legacy - to be removed later
   */
  getSuggestions: {
    input: {
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

export type KottsterApiInput<T extends keyof KottsterApiSchema> = KottsterApiSchema[T]['input'];

export type KottsterApiResult<T extends keyof KottsterApiSchema> = KottsterApiSchema[T]['result'];
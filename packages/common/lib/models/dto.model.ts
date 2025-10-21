import { AppSchema, ClientAppSchema } from "./appSchema.model";
import { DashboardPageConfig, DashboardPageConfigCard, DashboardPageConfigStat } from "./dashboardPage.model";
import { RelationalDatabaseSchema } from "./databaseSchema.model";
import { DataSourceType, PublicDataSource } from "./dataSource.model";
import { Page, PageFileStructure } from "./page.model";
import { TablePageConfig } from "./tablePage.model";
import { Template } from "./template.model";
import { ClientIdentityProviderRole, ClientIdentityProviderUser, ClientIdentityProviderUserWithRoles, IdentityProviderUserPermission, User } from "./idp.model";

export interface InternalApiSchema {
  getUsers: {
    body: unknown;
    result: {
      users: ClientIdentityProviderUser[];
    };
  };

  createUser: {
    body: {
      user: Pick<ClientIdentityProviderUser, 'firstName' | 'email' | 'avatarUrl' | 'lastName' | 'username' | 'roleIds' | 'temporaryPassword'>;
      password: string;
    };
    result: {
      user: ClientIdentityProviderUser;
    };
  };

  updateUser: {
    body: {
      userId: ClientIdentityProviderUser['id'];
      user: Partial<ClientIdentityProviderUser>;
      newPassword?: string;
    };
    result: {
      user: ClientIdentityProviderUser;
    };
  };

  deleteUser: {
    body: {
      userId: ClientIdentityProviderUser['id'];
    };
    result: void;
  };

  createRole: {
    body: {
      role: Pick<ClientIdentityProviderRole, 'name' | 'permissions'>;
    };
    result: {
      role: ClientIdentityProviderRole;
    };
  };

  updateRole: {
    body: {
      roleId: ClientIdentityProviderRole['id'];
      role: Partial<ClientIdentityProviderRole>;
    };
    result: {
      role: ClientIdentityProviderRole;
    };
  };

  deleteRole: {
    body: {
      roleId: ClientIdentityProviderRole['id'];
    };
    result: void;
  };

  getApp: {
    body: unknown;
    result: {
      schema: ClientAppSchema; 

      // Pass only if user is authenticated
      user?: ClientIdentityProviderUserWithRoles;
      roles?: ClientIdentityProviderRole[];
      userPermissions?: (keyof typeof IdentityProviderUserPermission | string)[];
    };
  };

  generateSql: {
    body: {
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
    body: {
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
    body: {
      password: string;
      newPassword: string;
    };
    result: void;
  };

  logOutAllSessions: {
    body: {
      password: string;
    };
    result: void;
  };

  getDataSources: {
    body: {
      withSchema?: boolean;
    };
    result: PublicDataSource[];
  };

  getDataSourceSchema: {
    body: {
      name: string;
    };
    result: RelationalDatabaseSchema;
  };

  initApp: {
    body: {
      name: string;
      rootUsername: string;
      rootPassword: string;
    };
    result: {
      rootUserJwtToken: string;
    };
  };

  createPage: {
    body: {
      key: string;
      file?: PageFileStructure;
    };
    result: void;
  };

  updatePage: {
    body: {
      key: string;
      page: Page;
    };
    result: void;
  };

  deletePage: {
    body: {
      key: string;
    };
    result: void;
  };

  updateAppSchema: {
    body: {
      menuPageOrder?: AppSchema['menuPageOrder'];
    };
    result: void;
  };

  addDataSource: {
    body: {
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
    body: {
      name: string;
    };
    result: void;
  };

  installPackagesForDataSource: {
    body: {
      type: DataSourceType;
    };
    result: void;
  };

  getProjectSettings: {
    body: unknown;
    result: {
      usingTsc: boolean;
    };
  };

  getKottsterContext: {
    body: unknown;
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

export type InternalApiBody<T extends keyof InternalApiSchema> = InternalApiSchema[T]['body'];
export type InternalApiResult<T extends keyof InternalApiSchema> = InternalApiSchema[T]['result'];

enum InternalApiBodyGenerateSqlPurpose {
  tableCustomSqlQuery = 'tableCustomSqlQuery',
  tableCustomSqlCountQuery = 'tableCustomSqlCountQuery',
  tableCalculatedColumnSqlQuery = 'tableCalculatedColumnSqlQuery',
  dashboardStatSqlQuery = 'dashboardStatSqlQuery',
  dashboardStatSqlTotalQuery = 'dashboardStatSqlTotalQuery',
  dashboardCardSqlQuery = 'dashboardCardSqlQuery',
}

export type InternalApiGenerateSqlPurposeKeys = keyof typeof InternalApiBodyGenerateSqlPurpose;

/**
 * @deprecated Use InternalApiSchema instead
 */
export interface KottsterApiSchema {
  createApp: {
    body: unknown;
    result: {
      apiToken: string;
    };
  };

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
  };
  
  getKottsterContext: {
    body: unknown;
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
    body: {
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
    body: null;
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
    body: null;
    result: User;
  };

  /**
   * @deprecated Legacy - to be removed later
   */
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

  /**
   * @deprecated Legacy - to be removed later
   */
  getStorageValue: {
    body: null;
    result: string;
  }

  /**
   * @deprecated Legacy - to be removed later
   */
  getTemplates: {
    body: null;
    result: Template[];
  },

  /**
   * @deprecated Legacy - to be removed later
   */
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
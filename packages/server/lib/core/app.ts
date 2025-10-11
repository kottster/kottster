import { ExtendAppContextFunction } from '../models/appContext.model';
import { PROJECT_DIR } from '../constants/projectDir';
import { AppSchema, checkTsUsage, DataSource, Stage, User, RpcActionBody, TablePageGetRecordsInput, TablePageDeleteRecordInput, TablePageUpdateRecordInput, TablePageCreateRecordInput, isSchemaEmpty, schemaPlaceholder, TablePageGetRecordInput, Page, TablePageConfig, TablePageCustomDataFetcherInput, TablePageGetRecordsResult, DashboardPageConfig, DashboardPageGetStatDataInput, DashboardPageGetCardDataInput, DashboardPageGetStatDataResult, DashboardPageGetCardDataResult, checkUserForRoles, IdentityProviderUser, InternalApiSchema, PartialTablePageConfig, transformStringToTablePageNestedTableKey, PartialDashboardPageConfig, DashboardPageConfigStat, DashboardPageConfigCard } from '@kottster/common';
import { DataSourceRegistry } from './dataSourceRegistry';
import { ActionService } from '../services/action.service';
import { DataSourceAdapter } from '../models/dataSourceAdapter.model';
import { parse as parseCookie } from 'cookie';
import { Request, Response, NextFunction } from 'express';
import { createServer } from '../factories/createServer';
import { IdentityProvider } from './identityProvider';
import { HttpException, UnauthorizedException } from '../exceptions/httpException';
import { FileReader } from '../services/fileReader.service';

type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;

type PostAuthMiddleware = (user: IdentityProviderUser, request: Request) => void | Promise<void>;

export interface KottsterAppOptions {
  schema: AppSchema | Record<string, never>;
  
  /**
   * The secret key used to sign JWT tokens
   */
  secretKey?: string;

  /**
   * The root admin username
   */
  rootUsername?: string;

  /**
   * The root admin password
   */
  rootPassword?: string;

  /**
   * The root admin custom permissions
   */
  rootCustomPermissions?: string[];

  /**
   * The salt used to sign JWT tokens
   */
  jwtSecretSalt?: string;

  /**
   * The identity provider configuration
   */
  identityProvider?: IdentityProvider;

  /**
   * The Kottster API token for the appen.
   * If not provided, some features that require server-side requests to Kottster API will not work (e.g. sql query generation, AI features, etc.)
   */
  kottsterApiToken?: string;

  /** 
   * Custom validation middleware
   * @description This middleware will be called after the JWT token is validated. You can use it to perform additional checks or modify the request object.
   * @example https://kottster.app/docs/security/authentication#custom-validation-middleware 
   */
  postAuthMiddleware?: PostAuthMiddleware;

  /** Enable read-only mode */
  __readOnlyMode?: boolean;

  /** Custom token validation function */
  __ensureValidToken?: (request: Request) => Promise<EnsureValidTokenResponse>;
}

interface EnsureValidTokenResponse {
  isTokenValid: boolean;
  user: IdentityProviderUser | null;
  invalidTokenErrorMessage?: string;
}

/**
 * The main app class
 */
export class KottsterApp {
  public readonly appId: string;
  
  private readonly secretKey: string;
  private readonly kottsterApiToken?: string;

  public readonly usingTsc: boolean;
  public readonly readOnlyMode: boolean = false;
  public readonly stage: Stage = process.env.KOTTSTER_APP_STAGE === Stage.development ? Stage.development : Stage.production;
  
  // TODO: store registry instead of data sources
  public dataSources: DataSource[] = [];

  public identityProvider: IdentityProvider;

  public schema: AppSchema;
  private customEnsureValidToken?: (request: Request) => Promise<EnsureValidTokenResponse>;
  private postAuthMiddleware?: PostAuthMiddleware;

  public loadedPageConfigs: Page[] = [];

  public loadPageConfigs(): Page[] {
    const isDevelopment = this.stage === Stage.development;
    const fileReader = new FileReader(isDevelopment);
    this.loadedPageConfigs = fileReader.getPageConfigs();

    return this.loadedPageConfigs;
  }

  /**
   * Used to store the token cache
   */
  private tokenCache = new Map<string, { data: User; expires: number }>();
  
  public extendContext: ExtendAppContextFunction;

  public getSecretKey() {
    return `${this.secretKey}`;
  }

  public getKottsterApiToken() {
    return this.kottsterApiToken;
  }

  constructor(options: KottsterAppOptions) {
    this.appId = options.schema.id ?? '';
    this.secretKey = options.secretKey ?? '';
    this.kottsterApiToken = options.kottsterApiToken;
    this.usingTsc = checkTsUsage(PROJECT_DIR);
    this.schema = (!isSchemaEmpty(options.schema) ? options.schema : schemaPlaceholder) as AppSchema;
    this.customEnsureValidToken = options.__ensureValidToken;
    this.postAuthMiddleware = options.postAuthMiddleware;
    this.readOnlyMode = options.__readOnlyMode ?? false;
    
    // Set identity provider
    if (!options.identityProvider) {
      throw new Error('Your KottsterApp must be configured with an identity provider. See https://kottster.app/docs/upgrade-to-v3-2 for more details.');
    } else {
      this.identityProvider = options.identityProvider;
      this.identityProvider.setApp(this);
    }
  }

  async initialize() {
    await this.identityProvider.initialize();
  }

  /**
   * Load from a data source registry
   * @param registry The data source registry
   */
  public loadFromDataSourceRegistry(registry: DataSourceRegistry<{}>) {
    this.dataSources = Object.values(registry.dataSources);

    this.dataSources.forEach(dataSource => {
      const adapter = dataSource.adapter as DataSourceAdapter;

      if (this) {
        adapter.setApp(this);
        adapter.setData(dataSource);
        adapter.setTablesConfig(dataSource.tablesConfig);
        adapter.connect();
      };
    });
  }

  /**
   * Register a context middleware
   * @param fn The function to extend the context
   */
  public registerContextMiddleware(fn: ExtendAppContextFunction) {
    this.extendContext = fn;
  }

  public async executeAction(action: string, data: any, user?: IdentityProviderUser, req?: Request): Promise<any> {
    return await ActionService.getAction(this, action).executeWithCheckings(data, user, req);
  }

  /**
   * Get the middleware for the app
   * @param req The request object
   * @returns The middleware function
   */
  public getInternalApiRoute() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET') {
        next();
        return;
      }
  
      try {
        const result = await this.handleInternalApiRequest(req);
        
        if (result) {
          res.setHeader('Content-Type', 'application/json');
          res.status(200).json(result);
          return;
        } else {
          res.status(404).json({ error: 'Not Found' });
          return;
        }
      } catch (error) {
        if (error instanceof HttpException) {
          res.status(error.statusCode).json({
            status: 'error',
            statusCode: error.statusCode,
            message: error.message
          });
          return;
        }
        
        console.error('Internal API error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
    }
  }

  private async handleInternalApiRequest(request: Request): Promise<{
    status: 'success' | 'error';
    result?: any;
    error?: string;
  }> {
    try {
      const { isTokenValid, invalidTokenErrorMessage, user } = await this.ensureValidToken(request);

      const action = request.query.action as keyof InternalApiSchema | undefined;
      const actionData = request.body;

      if (!action) {
        throw new Error('Action not found in request');
      }
      
      if (!isTokenValid && action && !(['getApp', 'initApp', 'login'] as (keyof InternalApiSchema)[]).includes(action)) {
        throw new UnauthorizedException(`Invalid JWT token: ${invalidTokenErrorMessage}`);
      }
      
      return {
        status: 'success',
        result: await this.executeAction(action, actionData, user ?? undefined, request),
      };
    } catch (error) {
      // If the error is an instance of HttpException, we can rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Kottster API error:', error);
      
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Define a custom controller
   * @param procedures The procedures
   * @returns The express request handler
   */
  public defineCustomController<T extends Record<string, (input: any) => any>>(
    procedures: T
  ): RequestHandler & { procedures: T } {
    const func: RequestHandler = async (req, res) => {
      const { isTokenValid, invalidTokenErrorMessage } = await this.ensureValidToken(req);
      if (!isTokenValid) {
        res.status(401).json({ error: `Invalid JWT token: ${invalidTokenErrorMessage}` });
        return;
      }

      const body = await req.body as RpcActionBody<'custom'>;
      const { procedure, procedureInput } = body.input;

      if (procedure in procedures) {
        try {
          const result = await procedures[procedure](procedureInput);
          res.json({
            status: 'success',
            result,
          });
          return;
        } catch (error) {
          console.error(`Error executing procedure "${procedure}":`, error);
          res.status(500).json({
            status: 'error',
            error: error.message,
          });
          return;
        }
      }

      res.status(404).json({ error: `Procedure "${procedure}" not found` });
      return;
    };

    // Attach the procedures to the function for later reference
    (func as any).procedures = procedures;

    return func as RequestHandler & { procedures: T };
  }

  /**
   * Define a dashboard controller
   * @param dashboardPageConfig The dashboard page config
   * @returns The express request handler
   */
  public defineDashboardController(partialDashboardPageConfig: PartialDashboardPageConfig) {
    const func: RequestHandler = async (req, res) => {
      const { isTokenValid, user, invalidTokenErrorMessage } = await this.ensureValidToken(req);
      if (!isTokenValid || !user) {
        res.status(401).json({ error: `Invalid JWT token: ${invalidTokenErrorMessage}` });
        return;
      }

      const page = (req as Request & { page?: Page }).page;
      if (!page || page.type !== 'dashboard') {
        res.status(404).json({ error: 'Specified page not found' });
        return;
      }

      // Merge the partial config with the page config
      const dashboardPageConfig: DashboardPageConfig = {
        ...page.config,
        ...partialDashboardPageConfig as Partial<DashboardPageConfig>,
        stats: [
          ...(page.config.stats ?? []),
          ...(partialDashboardPageConfig.stats ?? [])
        ].reduce((acc, stat) => {
          const existingIndex = acc.findIndex(s => s.key === stat.key);
          if (existingIndex >= 0) {
            acc[existingIndex] = { ...acc[existingIndex], ...stat } as DashboardPageConfigStat;
          } else {
            acc.push(stat as DashboardPageConfigStat);
          }
          return acc;
        }, [] as NonNullable<DashboardPageConfig['stats']>),
        cards: [
          ...(page.config.cards ?? []),
          ...(partialDashboardPageConfig.cards ?? [])
        ].reduce((acc, card) => {
          const existingIndex = acc.findIndex(c => c.key === card.key);
          if (existingIndex >= 0) {
            acc[existingIndex] = { ...acc[existingIndex], ...card } as DashboardPageConfigCard;
          } else {
            acc.push(card as DashboardPageConfigCard);
          }
          return acc;
        }, [] as NonNullable<DashboardPageConfig['cards']>)
      };

      try {
        const body = await req.body as RpcActionBody<'dashboard_getCardData' | 'dashboard_getStatData'>;
        let result: any;
        
        try {
          if (page.allowedRoleIds?.length && !checkUserForRoles(user, page.allowedRoleIds) && this.stage === Stage.production) {
            throw new Error('You do not have access to this page');
          }

          if (body.action === 'dashboard_getStatData') {
            const input = body.input as DashboardPageGetStatDataInput;
            const stat = dashboardPageConfig.stats?.find(s => s.key === input.statKey);
            if (!stat) {
              res.status(404).json({ error: `Specified stat "${input.statKey}" not found` });
              return;
            }

            if (stat.fetchStrategy === 'rawSqlQuery') {
              if (!stat.dataSource) {
                throw new Error(`Data source for stat not specified`);
              }
  
              const dataSource = this.dataSources.find(ds => ds.name === stat.dataSource);
              if (!dataSource) {
                throw new Error(`Data source "${stat.dataSource}" not found`);
              }

              const dataSourceAdapter = dataSource.adapter as DataSourceAdapter | undefined;
              if (!dataSourceAdapter) {
                throw new Error(`Data source adapter for "${stat.dataSource}" not found`);
              }

              result = await dataSourceAdapter.getStatData(input, stat);
            } else if (stat.fetchStrategy === 'customFetch') {
              if (!stat.customDataFetcher) {
                // Fallback to default result if no custom fetcher is provided
                console.warn(`Custom data fetcher for stat "${stat.key}" not specified`);
                result = {
                  value: 0,
                  total: 0,
                } as DashboardPageGetStatDataResult;
              } else {
                result = await stat.customDataFetcher(input);
              }
            }
          }
          else if (body.action === 'dashboard_getCardData') {
            const input = body.input as DashboardPageGetCardDataInput;
            const card = dashboardPageConfig.cards?.find(c => c.key === input.cardKey);
            if (!card) {
              res.status(404).json({ error: `Specified card "${input.cardKey}" not found` });
              return;
            }

            if (card.fetchStrategy === 'rawSqlQuery') {
              if (!card.dataSource) {
                throw new Error(`Data source for card not specified`);
              }
  
              const dataSource = this.dataSources.find(ds => ds.name === card.dataSource);
              if (!dataSource) {
                throw new Error(`Data source "${card.dataSource}" not found`);
              }

              const dataSourceAdapter = dataSource.adapter as DataSourceAdapter | undefined;
              if (!dataSourceAdapter) {
                throw new Error(`Data source adapter for "${card.dataSource}" not found`);
              }

              result = await dataSourceAdapter.getCardData(input, card);
            } else if (card.fetchStrategy === 'customFetch') {
              if (!card.customDataFetcher) {
                // Fallback to default result if no custom fetcher is provided
                console.warn(`Custom data fetcher for card "${card.key}" not specified`);
                result = {
                  items: [],
                } as DashboardPageGetCardDataResult;
              } else {
                result = await card.customDataFetcher(input);
              }
            }
          }
        } catch (error) {
          throw new Error(error);
        }
        
        res.json({
          status: 'success',
          result,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
          return new Response('Unauthorized', { status: 401 });
        }

        console.error('Error executing dashboard RPC:', error);
        res.status(500).json({
          status: 'error',
          error: error.message,
        });
        return;
      }
    }

    return func;
  }

  /**
   * Define a table controller
   * @param dataSource The data source
   * @param pageSettings The page settings
   * @returns The express request handler
   */
  public defineTableController<T extends Record<string, (input: any) => any>>(
    partialTablePageConfig: PartialTablePageConfig,
    procedures?: T
  ): RequestHandler  & { procedures: T } {
    const func: RequestHandler = async (req, res, next) => {
      const { isTokenValid, user, invalidTokenErrorMessage } = await this.ensureValidToken(req);
      if (!isTokenValid || !user) {
        res.status(401).json({ error: `Invalid JWT token: ${invalidTokenErrorMessage}` });
        return;
      }
      
      const page = (req as Request & { page?: Page }).page;
      if (!page || page.type !== 'table') {
        res.status(404).json({ error: 'Specified page not found' });
        return;
      }

      // Merge the partial config with the page config
      const tablePageConfig: TablePageConfig = {
        ...page.config,
        ...partialTablePageConfig as Partial<TablePageConfig>,
        nested: {
          ...page.config.nested,
          ...Object.keys(partialTablePageConfig.nested || {}).reduce((acc, key) => {
            const tablePageNestedTableKey = transformStringToTablePageNestedTableKey(key);
            acc[key] = {
              // We need to pass these required properties for nested table config
              table: tablePageNestedTableKey[tablePageNestedTableKey.length - 1]?.table,
              fetchStrategy: 'databaseTable',

              ...page.config.nested?.[key],
              ...partialTablePageConfig.nested?.[key] as Partial<TablePageConfig>,
            };
            return acc;
          }, {} as Record<string, TablePageConfig>)
        }
      };
      
      
      try {
        // Check if specified data source exists
        const dataSource = this.dataSources.find(ds => ds.name === tablePageConfig.dataSource);
        if (!dataSource && (tablePageConfig.fetchStrategy === 'databaseTable' || tablePageConfig.fetchStrategy === 'rawSqlQuery')) {
          throw new Error(`Data source "${tablePageConfig.dataSource}" not found`);
        }
  
        const body = await req.body as RpcActionBody<'table_getRecords' | 'table_getRecord' | 'table_createRecord' | 'table_updateRecord' | 'table_deleteRecord' | 'custom'>;
        const action = body.action;
        let result: any;
        
        // If the request is a custom one, handle it by the custom controller
        if (action === 'custom') {
          return this.defineCustomController(procedures as T)(req, res, next);
        }

        try {
          const dataSourceAdapter = dataSource?.adapter as DataSourceAdapter | undefined;
          const databaseSchema = dataSourceAdapter ? await dataSourceAdapter.getDatabaseSchema() : undefined;

          if (page.allowedRoleIds?.length && !checkUserForRoles(user, page.allowedRoleIds) && this.stage === Stage.production) {
            throw new Error('You do not have access to this page');
          }
          
          // If the table select action is used and fetch strategy is 'customFetch', we need to execute the custom query right away
          if (body.action === 'table_getRecords' && tablePageConfig.fetchStrategy === 'customFetch') {
            result = tablePageConfig.customDataFetcher ? await tablePageConfig.customDataFetcher(body.input as TablePageCustomDataFetcherInput) : {
              records: [],
            } as TablePageGetRecordsResult;
          } else {
            if (!dataSource) {
              throw new Error(`Data source "${tablePageConfig.dataSource}" not found`);
            }
            if (!dataSourceAdapter) {
              throw new Error(`Data source adapter for "${tablePageConfig.dataSource}" not found`);
            }
            if (!databaseSchema) {
              throw new Error(`Database schema for "${tablePageConfig.dataSource}" not found`);
            }
            
            if (body.action === 'table_getRecords') {
              result = await dataSourceAdapter?.getTableRecords(tablePageConfig, body.input as TablePageGetRecordsInput, databaseSchema);
            } else if (body.action === 'table_getRecord') {
              result = await dataSourceAdapter.getOneTableRecord(tablePageConfig, body.input as TablePageGetRecordInput, databaseSchema);
            } else if (body.action === 'table_createRecord') {
              if (tablePageConfig.allowedRoleIdsToInsert?.length && this.stage === Stage.production && !checkUserForRoles(user, tablePageConfig.allowedRoleIdsToInsert)) {
                throw new Error('You do not have permission to create records in this table');
              }

              result = await dataSourceAdapter.insertTableRecord(tablePageConfig, body.input as TablePageCreateRecordInput, databaseSchema);
            } else if (body.action === 'table_updateRecord') {
              if (tablePageConfig.allowedRoleIdsToUpdate?.length && this.stage === Stage.production && !checkUserForRoles(user, tablePageConfig.allowedRoleIdsToUpdate)) {
                throw new Error('You do not have permission to update records in this table');
              }

              result = await dataSourceAdapter.updateTableRecords(tablePageConfig, body.input as TablePageUpdateRecordInput, databaseSchema);
            } else if (body.action === 'table_deleteRecord') {
              if (tablePageConfig.allowedRoleIdsToDelete?.length && this.stage === Stage.production && !checkUserForRoles(user, tablePageConfig.allowedRoleIdsToDelete)) {
                throw new Error('You do not have permission to delete records in this table');
              }

              result = await dataSourceAdapter.deleteTableRecords(tablePageConfig, body.input as TablePageDeleteRecordInput, databaseSchema);
            };
          };
        } catch (error) {
          throw new Error(error);
        }
        
        res.json({
          status: 'success',
          result,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
          return new Response('Unauthorized', { status: 401 });
        }

        console.error('Error executing table RPC:', error);
        res.status(500).json({
          status: 'error',
          error: error.message,
        });
        return;
      }
    };

    // Attach the procedures to the function for later reference
    (func as any).procedures = procedures;

    return func as RequestHandler & { procedures: T };
  };

  public createRequestWithPageDataMiddleware(pageConfig: Page): RequestHandler {
    const handler: RequestHandler = (req, res, next) => {
      (req as Request & { page?: Page }).page = pageConfig;

      next();
    };

    return handler;
  }

  private async ensureValidToken(request: Request): Promise<EnsureValidTokenResponse> {
    try {
      // If a custom token validation function is provided, use it
      if (this.customEnsureValidToken) {
        return this.customEnsureValidToken(request);
      }

      let token = request.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        const cookieHeader = request.get('Cookie');
        const cookieData = parseCookie(cookieHeader ?? '');
        token = cookieData.jwtToken;
      }
      if (!token) {
        return { 
          isTokenValid: false, 
          user: null,
          invalidTokenErrorMessage: 'Invalid JWT token: token not passed' 
        };
      }
    
      const user = await this.identityProvider.verifyTokenAndGetUser(token);

      // If a post-auth middleware is provided, call it
      if (this.postAuthMiddleware) {
        await this.postAuthMiddleware(user, request);
      }
      
      return { 
        isTokenValid: true, 
        user,
      };
    } catch (error) {
      console.error('Error verifying token', error)
      return { 
        isTokenValid: false, 
        user: null, 
        invalidTokenErrorMessage: error.message 
      };
    }
  }

  /**
   * Get the registered data sources
   */
  public getDataSources() {
    return this.dataSources;
  }

  public async listen() {
    return createServer({
      app: this,
    });
  }
}

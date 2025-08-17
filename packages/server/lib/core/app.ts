import * as jose from 'jose';
import { ExtendAppContextFunction } from '../models/appContext.model';
import { PROJECT_DIR } from '../constants/projectDir';
import { AppSchema, checkTsUsage, DataSource, JWTTokenPayload, Stage, User, RpcActionBody, TablePageInputSelect, TablePageInputDelete, TablePageInputUpdate, TablePageInputInsert, isSchemaEmpty, schemaPlaceholder, ApiResponse, TablePageInputSelectSingle, Page, TablePageConfig, TablePageInputSelectUsingExecuteQuery, TablePageSelectResult, DashboardPageConfig, DashboardPageInputGetStatData, DashboardPageInputGetCardData, DashboardPageGetStatDataResult, DashboardPageGetCardDataResult } from '@kottster/common';
import { DataSourceRegistry } from './dataSourceRegistry';
import { ActionService } from '../services/action.service';
import { DataSourceAdapter } from '../models/dataSourceAdapter.model';
import { parse as parseCookie } from 'cookie';
import { Request, Response, NextFunction } from 'express';
import { createServer } from '../factories/createServer';

type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;

type PostAuthMiddleware = (user: User, request: Request) => void | Promise<void>;

export interface KottsterAppOptions {
  secretKey?: string;
  schema: AppSchema | Record<string, never>;

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
  user: User | null;
  invalidTokenErrorMessage?: string;
}

/**
 * The main app class
 */
export class KottsterApp {
  public readonly appId: string;
  private readonly secretKey: string;
  public readonly usingTsc: boolean;
  public readonly readOnlyMode: boolean = false;
  public readonly stage: Stage = process.env.NODE_ENV === Stage.development ? Stage.development : Stage.production;
  public dataSources: DataSource[] = [];
  public schema: AppSchema;
  private customEnsureValidToken?: (request: Request) => Promise<EnsureValidTokenResponse>;
  private postAuthMiddleware?: PostAuthMiddleware;

  /**
   * Used to store the token cache
   */
  private tokenCache = new Map<string, { data: { user: User; appId: string }; expires: number }>();
  
  public extendContext: ExtendAppContextFunction;

  constructor(options: KottsterAppOptions) {
    this.appId = options.schema.id ?? '';
    this.secretKey = options.secretKey ?? '';
    this.usingTsc = checkTsUsage(PROJECT_DIR);
    this.schema = (!isSchemaEmpty(options.schema) ? options.schema : schemaPlaceholder) as AppSchema;
    this.customEnsureValidToken = options.__ensureValidToken;
    this.postAuthMiddleware = options.postAuthMiddleware;
    this.readOnlyMode = options.__readOnlyMode ?? false;
  }

  /**
   * Register data sources
   * @param registry The data source registry
   */
  public registerDataSources(registry: DataSourceRegistry<{}>) {
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

  public async executeAction(action: string, data: any) {
    return await ActionService.getAction(this, action).execute(data);
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
        console.error('Error handling internal API request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
    }
  }

  private async handleInternalApiRequest(request: Request): Promise<any> {
    let result: ApiResponse;
    
    try {
      const { isTokenValid, invalidTokenErrorMessage } = await this.ensureValidToken(request);

      const action = request.query.action as string | undefined;
      const actionData = request.body;
      
      // If the action is 'getAppSchema', we don't need to throw an error for invalid token
      if (!isTokenValid && action !== 'getAppSchema' && action !== 'initApp') {
        throw new Error(`Invalid JWT token: ${invalidTokenErrorMessage}`);
      }

      if (!action) {
        throw new Error('Action not found in request');
      }
  
      result = {
        status: 'success',
        result: await this.executeAction(action, actionData),
      };
    } catch (error) {
      console.error('Error handling Kottster API request:', error);
      
      result = {
        status: 'error',
        error: error.message,
      };
    }

    return result;
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
  public defineDashboardController(dashboardPageConfig: DashboardPageConfig) {
    const func: RequestHandler = async (req, res) => {
      const { isTokenValid, user, invalidTokenErrorMessage } = await this.ensureValidToken(req);
      if (!isTokenValid || !user) {
        res.status(401).json({ error: `Invalid JWT token: ${invalidTokenErrorMessage}` });
        return;
      }

      const page = (req as Request & { page?: Page }).page;
      if (!page) {
        res.status(404).json({ error: 'Specified page not found' });
        return;
      }

      try {
        const body = await req.body as RpcActionBody<'dashboard_getCardData' | 'dashboard_getStatData'>;
        let result: any;

        try {
          if (page.allowedRoleIds?.length && !page.allowedRoleIds.includes(user.role.id) && this.stage === Stage.production) {
            throw new Error('You do not have access to this page');
          }

          if (body.action === 'dashboard_getStatData') {
            const input = body.input as DashboardPageInputGetStatData;
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
            const input = body.input as DashboardPageInputGetCardData;
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
    tablePageConfig: TablePageConfig,
    procedures?: T
  ): RequestHandler  & { procedures: T } {
    // Check if specified data source exists
    const dataSource = this.dataSources.find(ds => ds.name === tablePageConfig.dataSource);
    if (!dataSource && (tablePageConfig.fetchStrategy === 'databaseTable' || tablePageConfig.fetchStrategy === 'rawSqlQuery')) {
      throw new Error(`Data source "${tablePageConfig.dataSource}" not found`);
    }

    const func: RequestHandler = async (req, res, next) => {
      const body = await req.body as RpcActionBody<'custom'>;
      const action = body.action;

      const { isTokenValid, user, invalidTokenErrorMessage } = await this.ensureValidToken(req);
      if (!isTokenValid || !user) {
        res.status(401).json({ error: `Invalid JWT token: ${invalidTokenErrorMessage}` });
        return;
      }

      const page = (req as Request & { page?: Page }).page;
      if (!page) {
        res.status(404).json({ error: 'Specified page not found' });
        return;
      }

      // If the request is a custom one, handle it by the custom controller
      if (action === 'custom') {
        return this.defineCustomController(procedures as T)(req, res, next);
      }

      try {
        const body = await req.body as RpcActionBody<'table_select' | 'table_selectOne' | 'table_insert' | 'table_update' | 'table_delete'>;
        let result: any;

        try {
          const dataSourceAdapter = dataSource?.adapter as DataSourceAdapter | undefined;
          const databaseSchema = dataSourceAdapter ? await dataSourceAdapter.getDatabaseSchema() : undefined;

          if (page.allowedRoleIds?.length && !page.allowedRoleIds.includes(user.role.id) && this.stage === Stage.production) {
            throw new Error('You do not have access to this page');
          }
          
          // If the table select action is used and fetch strategy is 'customFetch', we need to execute the custom query right away
          if (body.action === 'table_select' && tablePageConfig.fetchStrategy === 'customFetch') {
            result = tablePageConfig.customDataFetcher ? await tablePageConfig.customDataFetcher(body.input as TablePageInputSelectUsingExecuteQuery) : {
              records: [],
            } as TablePageSelectResult;
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
            
            if (body.action === 'table_select') {
              result = await dataSourceAdapter?.getTableRecords(body.input as TablePageInputSelect, databaseSchema, tablePageConfig);
            } else if (body.action === 'table_selectOne') {
              result = await dataSourceAdapter.getOneTableRecord(body.input as TablePageInputSelectSingle, databaseSchema, tablePageConfig);
            } else if (body.action === 'table_insert') {
              if (tablePageConfig.allowedRoleIdsToInsert?.length && this.stage === Stage.production && !tablePageConfig.allowedRoleIdsToInsert.includes(user.role.id)) {
                throw new Error('You do not have permission to create records in this table');
              }

              result = await dataSourceAdapter.insertTableRecord(body.input as TablePageInputInsert, databaseSchema, tablePageConfig);
            } else if (body.action === 'table_update') {
              if (tablePageConfig.allowedRoleIdsToUpdate?.length && this.stage === Stage.production && !tablePageConfig.allowedRoleIdsToUpdate.includes(user.role.id)) {
                throw new Error('You do not have permission to update records in this table');
              }

              result = await dataSourceAdapter.updateTableRecords(body.input as TablePageInputUpdate, databaseSchema, tablePageConfig);
            } else if (body.action === 'table_delete') {
              if (tablePageConfig.allowedRoleIdsToDelete?.length && this.stage === Stage.production && !tablePageConfig.allowedRoleIdsToDelete.includes(user.role.id)) {
                throw new Error('You do not have permission to delete records in this table');
              }

              result = await dataSourceAdapter.deleteTableRecords(body.input as TablePageInputDelete, databaseSchema, tablePageConfig);
            }
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

  private cleanupExpiredTokenCache(): void {
    const now = Date.now();
    for (const [token, cached] of this.tokenCache.entries()) {
      if (cached.expires <= now) {
        this.tokenCache.delete(token);
      }
    }
  };

  private async getDataFromToken(token: string): Promise<{ user: User; appId: string }> {
    // Check cache and return cached data if available
    const cached = this.tokenCache.get(token);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(this.secretKey));
    const decodedToken = payload as unknown as JWTTokenPayload;
    if (!decodedToken.appId || decodedToken.appId !== this.appId || !decodedToken.userId) {
      throw new Error('Invalid JWT token');
    }

    const response = await fetch(`${process.env.KOTTSTER_API_BASE_URL || 'https://api.kottster.app'}/v3/apps/${this.appId}/users/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch user data by JWT token: ${response.statusText}`);
    };
    const user = await response.json() as User;
    const result = { 
      appId: decodedToken.appId,
      user 
    };

    // Cache result
    this.tokenCache.set(token, {
      data: result,
      expires: Date.now() + 60 * 1000 // 60s
    });
    this.cleanupExpiredTokenCache();
  
    return result;
  }

  public createRequestWithPageDataMiddleware(pageConfig: Page): RequestHandler {
    const handler: RequestHandler = (req, res, next) => {
      (req as Request & { page?: Page }).page = pageConfig;

      next();
    };

    return handler;
  }

  private async ensureValidToken(request: Request): Promise<EnsureValidTokenResponse> {
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

    if (!this.secretKey) {
      return { 
        isTokenValid: false, 
        user: null,
        invalidTokenErrorMessage: 'Invalid JWT token: secret key not set' 
      };
    }

    try {
      const { user, appId } = await this.getDataFromToken(token);
      if (String(appId) !== String(this.appId)) {
        throw new Error('Invalid JWT token: invalid app ID');
      }

      // If a post-auth middleware is provided, call it
      if (this.postAuthMiddleware) {
        await this.postAuthMiddleware(user, request);
      }
      
      return { 
        isTokenValid: true, 
        user,
      };
    } catch (error) {
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

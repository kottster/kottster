import { ExtendAppContextFunction } from '../models/appContext.model';
import { PROJECT_DIR } from '../constants/projectDir';
import { AppSchema, checkTsUsage, DataSource, JWTTokenPayload, Stage, User, RpcActionBody, TablePageInputSelect, TablePageInputDelete, TablePageInputUpdate, TablePageInputInsert, isSchemaEmpty, schemaPlaceholder, ApiResponse, TablePageInputSelectSingle, PageSettings, pageSettingsTablePageKey } from '@kottster/common';
import { DataSourceRegistry } from './dataSourceRegistry';
import { ActionService } from '../services/action.service';
import * as jose from 'jose';
import { commonHeaders } from '../constants/commonHeaders';
import { DataSourceAdapter } from '../models/dataSourceAdapter.model';
import { parse as parseCookie } from 'cookie';
import { SafePageSettings } from '../models/safePageSettings.model';
import { Request, Response, NextFunction } from 'express';
import { createServer } from '../factories/createServer';

type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;

export interface KottsterAppOptions {
  secretKey?: string;
  schema: AppSchema | Record<string, never>;

  /** Enable read-only mode */
  __readOnlyMode?: boolean;

  /** Custom token validation function */
  __ensureValidToken?: (request: Request) => Promise<EnsureValidTokenResponse>;
}

interface EnsureValidTokenResponse {
  isTokenValid: boolean;
  newRequest: Request;
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
  
  public extendContext: ExtendAppContextFunction;

  constructor(options: KottsterAppOptions) {
    this.appId = options.schema.id ?? '';
    this.secretKey = options.secretKey ?? '';
    this.usingTsc = checkTsUsage(PROJECT_DIR);
    this.schema = !isSchemaEmpty(options.schema) ? options.schema : schemaPlaceholder;
    this.customEnsureValidToken = options.__ensureValidToken;
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

  public async executeDevSyncAction(action: string, data: any) {
    return await ActionService.getDSAction(this, action).execute(data);
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

  /**
   * Get the middleware for the app
   * @param req The request object
   * @returns The middleware function
   */
  public getDevSyncApiRoute() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET') {
        next();
        return;
      }
  
      try {
        const result = await this.handleDevSyncApiRequest(req);
        
        if (result) {
          res.setHeader('Content-Type', 'application/json');
          res.status(200).json(result);
          return;
        } else {
          res.status(404).json({ error: 'Not Found' });
          return;
        }
      } catch (error) {
        console.error('Error handling devsync API request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
    }
  }

  private async handleInternalApiRequest(request: Request): Promise<any> {
    let result: ApiResponse;
    
    try {
      const { isTokenValid, newRequest, invalidTokenErrorMessage } = await this.ensureValidToken(request);
      if (!isTokenValid) {
        throw new Error(`Invalid JWT token: ${invalidTokenErrorMessage}`);
      }
      
      const action = newRequest.query.action as string | undefined;
      const actionData = newRequest.body;
  
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

  private async handleDevSyncApiRequest(request: Request): Promise<any> {
    let result: ApiResponse;
    
    try {
      const action = request.query.action as string | undefined;
      const actionData = request.body;
  
      if (!action) {
        return new Response('Action not found in request', { status: 400, headers: commonHeaders });
      }
  
      result = {
        status: 'success',
        result: await this.executeDevSyncAction(action, actionData),
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
      const { isTokenValid, newRequest, invalidTokenErrorMessage } = await this.ensureValidToken(req);
      if (!isTokenValid) {
        res.status(401).json({ error: `Invalid JWT token: ${invalidTokenErrorMessage}` });
        return;
      }

      const body = await newRequest.body as RpcActionBody<'custom'>;
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
   * Define a table controller
   * @param dataSource The data source
   * @param pageSettings The page settings
   * @returns The express request handler
   */
  public defineTableController<T extends Record<string, (input: any) => any>>(
    dataSource: DataSource, 
    pageSettings: SafePageSettings,
    procedures?: T
  ): RequestHandler  & { procedures: T } {
    const typesPageSettings = pageSettings as PageSettings;

    const func: RequestHandler = async (req, res, next) => {
      // If the request is a custom one, handle it by the custom controller
      const body = await req.body as RpcActionBody<'custom'>;
      const action = body.action;
      if (action === 'custom') {
        return this.defineCustomController(procedures as T)(req, res, next);
      }

      try {
        const result = await this.processTableControllerRequest(dataSource, req, typesPageSettings);
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

  private async processTableControllerRequest(dataSource: DataSource, request: Request, pageSettings: PageSettings): Promise<any> {
    const tablePageConfig = pageSettings[pageSettingsTablePageKey];

    const { isTokenValid, newRequest, invalidTokenErrorMessage } = await this.ensureValidToken(request);
    if (!isTokenValid) {
      throw new Error(`Invalid JWT token: ${invalidTokenErrorMessage}`);
    }

    const body = await newRequest.body as RpcActionBody<'page_settings' | 'table_select' | 'table_selectOne' | 'table_insert' | 'table_update' | 'table_delete'>;

    try {
      if (body.action === 'page_settings') {
        return pageSettings;
      } else {
        const dataSourceAdapter = dataSource.adapter as DataSourceAdapter;
        const databaseSchema = await dataSourceAdapter.getDatabaseSchema();

        if (body.action === 'table_select') {
          const result = await dataSourceAdapter.getTableRecords(body.input as TablePageInputSelect, databaseSchema, tablePageConfig);
          return result;
        } else if (body.action === 'table_selectOne') {
          const result = await dataSourceAdapter.getOneTableRecord(body.input as TablePageInputSelectSingle, databaseSchema);
          return result;
        } else if (body.action === 'table_insert') {
          const result = await dataSourceAdapter.insertTableRecord(body.input as TablePageInputInsert, databaseSchema);
          return result;
        } else if (body.action === 'table_update') {
          const result = await dataSourceAdapter.updateTableRecords(body.input as TablePageInputUpdate, databaseSchema);
          return result;
        } else if (body.action === 'table_delete') {
          const result = await dataSourceAdapter.deleteTableRecords(body.input as TablePageInputDelete, databaseSchema);
          return result;
        };
      }
    } catch (error) {
      throw new Error(error);
    }

    throw new Error('Invalid action');
  }

  private async getDataFromToken(token: string) {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(this.secretKey));
    const decodedToken = payload as unknown as JWTTokenPayload;
  
    const user: User = {
      id: decodedToken.userId,
      email: decodedToken.userEmail,
    };
  
    return { 
      appId: decodedToken.appId,
      user 
    };
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
      return { isTokenValid: false, newRequest: request, invalidTokenErrorMessage: 'Invalid JWT token: token not passed' };
    }

    if (!this.secretKey) {
      return { isTokenValid: false, newRequest: request, invalidTokenErrorMessage: 'Invalid JWT token: secret key not set' };
    }

    try {
      const { user, appId } = await this.getDataFromToken(token);
      if (String(appId) !== String(this.appId)) {
        throw new Error('Invalid JWT token: invalid app ID');
      }
      
      const newRequest = request as Request & { user?: User };
      newRequest.user = user;
      
      return { isTokenValid: true, newRequest };
    } catch (error) {
      return { isTokenValid: false, newRequest: request, invalidTokenErrorMessage: error.message };
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

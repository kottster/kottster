import { ExtendAppContextFunction } from '../models/appContext.model';
import { PROJECT_DIR } from '../constants/projectDir';
import { AppSchema, checkTsUsage, DataSource, JWTTokenPayload, Stage, User, TableRPC, RPCActionBody, TableRPCInputSelect, TableRPCInputDelete, TableRPCInputUpdate, TableRPCInputInsert, isSchemaEmpty, RPCResponse, schemaPlaceholder, InternalApiResponse, TableRPCInputSelectLinkedRecords, TableRPCSimplified } from '@kottster/common';
import { DataSourceRegistry } from './dataSourceRegistry';
import { ActionService } from '../services/action.service';
import * as jose from 'jose';
import { commonHeaders } from '../constants/commonHeaders';
import { ActionFunction, json } from "@remix-run/node";
import { DataSourceAdapter } from '../models/dataSourceAdapter.model';
import { parse as parseCookie } from 'cookie';

export interface KottsterAppOptions {
  secretKey?: string;
  schema: AppSchema | Record<string, never>;
}

/**
 * The main app class
 */
export class KottsterApp {
  public readonly appId: string;
  private readonly secretKey: string;
  public readonly usingTsc: boolean;
  public readonly stage: Stage = (process.env.NODE_ENV || 'production') as Stage;  
  public dataSources: DataSource[] = [];
  public schema: AppSchema;

  public extendContext: ExtendAppContextFunction;

  constructor(options: KottsterAppOptions) {
    this.appId = options.schema.id ?? '';
    this.secretKey = options.secretKey ?? '';
    this.usingTsc = checkTsUsage(PROJECT_DIR);
    this.schema = !isSchemaEmpty(options.schema) ? options.schema : schemaPlaceholder;
  }

  /**
   * Register data sources
   * @param registry The data source registry
   */
  public registerDataSources(registry: DataSourceRegistry<{}>) {
    this.dataSources = Object.values(registry.dataSources);
  }

  /**
   * Register a context middleware
   * @param fn The function to extend the context
   */
  public registerContextMiddleware(fn: ExtendAppContextFunction) {
    this.extendContext = fn;
  }

  /**
   * Execute an action
   * @param action The action to execute
   * @param data The data to pass to the action
   * @returns The result of the action
   */
  public async executeAction(action: string, data: any) {
    return await ActionService.getAction(this, action).execute(data);
  }

  /**
   * Create a service route action for the Remix app
   * @returns The action function
   */
  public createServiceRouteAction() {
    return this.createServiceRouteLoader();
  }

  /**
   * Create a service route loader for the Remix app
   * @param appRouter The tRPC router
   * @returns The loader function
   */
  public createServiceRouteLoader() {
    const loader = async ({ request }: { request: Request }) => {
      const { pathname } = new URL(request.url);

      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: commonHeaders });
      }
      
      // Handle Kottster API requests
      if (pathname.startsWith('/-/internal-api/v1')) {
        return this.handleInternalApiRequest(request);
      }

      return null;
    }

    return loader;
  }

  private enrichWithCors(response: Response): Response {
    const newHeaders = new Headers(response.headers);
    Object.entries(commonHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }

  /**
   * Get the Kottster API handler
   * @param request The request object
   * @returns The handler function
   */
  public async handleInternalApiRequest(request: Request): Promise<Response> {
    let response: InternalApiResponse;
    
    try {
      const [isTokenValid, newRequest] = await this.ensureValidToken(request);
      if (!isTokenValid) {
        return new Response(`Invalid JWT token, please check your app's secret key or reload the page`, { status: 401, headers: commonHeaders });
      }
      
      const { searchParams } = new URL(newRequest.url);
      const action = searchParams.get('action');
      const actionDataRaw = searchParams.get('actionData');
      const actionData = actionDataRaw ? JSON.parse(actionDataRaw) : {};
  
      if (!action) {
        return new Response('Action not found in request', { status: 400, headers: commonHeaders });
      }
  
      response = {
        status: 'success',
        result: await this.executeAction(action, actionData),
      };
    } catch (error) {
      console.error('Error handling Kottster API request:', error);
      
      response = {
        status: 'error',
        error: error.message,
      };
    }

    return json(response);
  }

  /**
   * Combine multiple RPC functions into one
   * @param functions The functions to combine
   * @returns The action function
   */
  public combineRPC(functions: ActionFunction[]): ActionFunction {
    const funcs: {
      createTableRPC?: typeof this.createTableRPC,
    } = {};
    
    functions.find(func => {
      const rpcFunction: 'createTableRPC' | 'createStatRPC' = func['rpcFunction'];

      if (rpcFunction === 'createTableRPC') {
        funcs.createTableRPC = func;
      }
    });

    const func: ActionFunction = async ({ request }) => {
      const body = await request.clone().json() as RPCActionBody<any>;
      
      if ('action' in body && 'input' in body) {
        if (body.action.startsWith('table_') && funcs.createTableRPC) {
          return funcs.createTableRPC!({ request });
        }
      }

      return new Response('Bad request', { status: 400 });
    };

    return func;
  }

  /**
   * Create a table RPC function
   * @param dataSource The data source
   * @param tableRPCSimplified The table RPC
   * @returns The action function
   */
  public createTableRPC(
    dataSource: DataSource, 
    tableRPCSimplified: TableRPCSimplified
  ): ActionFunction {
    const tableRPC: TableRPC = {
      ...tableRPCSimplified,
      insert: typeof tableRPCSimplified.insert === 'boolean' ? (tableRPCSimplified.insert ? {} : undefined) : tableRPCSimplified.insert,
      update: typeof tableRPCSimplified.update === 'boolean' ? (tableRPCSimplified.update ? {} : undefined) : tableRPCSimplified.update,
      delete: typeof tableRPCSimplified.delete === 'boolean' ? (tableRPCSimplified.delete ? {} : undefined) : tableRPCSimplified.delete,
    };

    const func: ActionFunction = async ({ request }) => {
      let response: RPCResponse;
      
      try {
        const res = await this.processTableRPC(dataSource, request, tableRPC);
        response = {
          status: 'success',
          result: res,
        };
      } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
          return new Response('Unauthorized', { status: 401 });
        }

        console.error('Error executing table RPC:', error);

        response = {
          status: 'error',
          error: error.message,
        };
      }

      return json(response);
    };
    
    func['rpcFunction'] = 'createTableRPC';
    
    return func;
  };

  private async processTableRPC(dataSource: DataSource, request: Request, tableRPC: TableRPC): Promise<any> {
    const [isTokenValid, newRequest] = await this.ensureValidToken(request);
    if (!isTokenValid) {
      throw new Error('Unauthorized');
    }

    const body = await newRequest.json() as RPCActionBody<'table_spec' | 'table_select' | 'table_selectLinkedRecords' | 'table_insert' | 'table_update' | 'table_delete'>;
    const dataSourceAdapter = dataSource.adapter as DataSourceAdapter;

    try {
      if (body.action === 'table_spec') {
        const tableSchema = await dataSourceAdapter.getTableSchema(tableRPC.table);
        if (!tableSchema) {
          return new Response('Table does not exist in the database', { status: 404 });
        }
        
        return { 
          tableRPC,
          tableSchema 
        };
      } else if (body.action === 'table_select') {
        const result = await dataSourceAdapter.getTableRecords(tableRPC, body.input as TableRPCInputSelect);
        return result;
      } else if (body.action === 'table_selectLinkedRecords') {
        const result = await dataSourceAdapter.getLinkedTableRecords(tableRPC, body.input as TableRPCInputSelectLinkedRecords);
        return result;
      } else if (body.action === 'table_insert') {
        const result = await dataSourceAdapter.insertTableRecord(tableRPC, body.input as TableRPCInputInsert);
        return result;
      } else if (body.action === 'table_update') {
        const result = await dataSourceAdapter.updateTableRecords(tableRPC, body.input as TableRPCInputUpdate);
        return result;
      } else if (body.action === 'table_delete') {
        const result = await dataSourceAdapter.deleteTableRecords(tableRPC, body.input as TableRPCInputDelete);
        return result;
      };
    } catch (error) {
      throw new Error(error);
    }

    throw new Error('Invalid action');
  }

  private async getDataFromToken(token: string) {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(this.secretKey));
    const decodedToken = payload as unknown as JWTTokenPayload;
  
    // Set the user on the request object
    const user: User = {
      id: decodedToken.userId,
      email: decodedToken.userEmail,
    };
  
    return { 
      appId: decodedToken.appId,
      user 
    };
  }

  private async ensureValidToken(request: Request): Promise<[boolean, Request]> {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      const cookieHeader = request.headers.get('Cookie');
      const cookieData = parseCookie(cookieHeader ?? '');
      token = cookieData.jwtToken;
    }
    if (!token) {
      throw new Error('Invalid JWT token: token not passed');
    }

    if (!this.secretKey) {
      throw new Error('Invalid JWT token: secret key not set');
    }

    try {
      const { user, appId } = await this.getDataFromToken(token);
  
      if (String(appId) !== String(this.appId)) {
        throw new Error('Invalid JWT token: invalid app ID');
      }
  
      // Clone the request and set the user
      const newRequest = request.clone();
      newRequest.headers.set('x-user', JSON.stringify(user));
      
      return [true, newRequest];
    } catch (error) {
      return [false, request];
    }
  }

  /**
   * Get the registered data sources
   */
  public getDataSources() {
    return this.dataSources;
  }
}

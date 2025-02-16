import { ExtendAppContextFunction } from '../models/appContext.model';
import { PROJECT_DIR } from '../constants/projectDir';
import { AppSchema, checkTsUsage, DataSource, JWTTokenPayload, Stage, User, TableRpc, RPCActionBody, TableRpcInputSelect, TableRpcInputDelete, TableRpcInputUpdate, TableRpcInputInsert, isSchemaEmpty, RPCResponse, schemaPlaceholder, InternalApiResponse, TableRpcSimplified, TableSpec, TableRpcInputSelectSingle } from '@kottster/common';
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
  public readonly stage: Stage = (process.env.NODE_ENV || 'production') as Stage;
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
      const { isTokenValid, newRequest, invalidTokenErrorMessage } = await this.ensureValidToken(request);
      if (!isTokenValid) {
        return new Response(`Invalid JWT token: ${invalidTokenErrorMessage}. Please check your app's secret key or reload the page.`, { status: 401, headers: commonHeaders });
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
   * Define a custom controller
   * @param procedures The procedures
   * @returns The action function
   */
  public defineCustomController(procedures: Record<string, (input: any) => {}>): ActionFunction {
    const func: ActionFunction = async ({ request }) => {
      const { isTokenValid, newRequest, invalidTokenErrorMessage } = await this.ensureValidToken(request);
      if (!isTokenValid) {
        return new Response(`Invalid JWT token: ${invalidTokenErrorMessage}`, { status: 401 });
      }

      const body = await newRequest.json() as RPCActionBody<'custom'>;
      const action = body.action;
      const { procedure, procedureInput } = body.input;

      if (procedure in procedures) {
        try {
          return json({
            status: 'success',
            result: await procedures[procedure](procedureInput),
          });
        } catch (error) {
          console.error(`Error executing procedure "${procedure}":`, error);
          return json({
            status: 'error',
            error: error.message,
          });
        }
      }

      return new Response(`Unknown procedure: ${action}`, { status: 404 });
    };

    return func;
  }

  /**
   * @deprecated Use defineTableController instead
   */
  public createTableRpc(dataSource: DataSource, tableRpc: TableRpcSimplified) {
    return this.defineTableController(dataSource, tableRpc);
  }

  /**
   * Define a table controller
   * @param dataSource The data source
   * @param tableRpcSimplified The table RPC
   * @returns The action function
   */
  public defineTableController(
    dataSource: DataSource, 
    tableRpcSimplified: TableRpcSimplified
  ): ActionFunction {
    const tableRpc: TableRpc = {
      ...tableRpcSimplified,
      insert: typeof tableRpcSimplified.insert === 'boolean' ? (tableRpcSimplified.insert ? {} : undefined) : tableRpcSimplified.insert,
      update: typeof tableRpcSimplified.update === 'boolean' ? (tableRpcSimplified.update ? {} : undefined) : tableRpcSimplified.update,
      delete: typeof tableRpcSimplified.delete === 'boolean' ? (tableRpcSimplified.delete ? {} : undefined) : tableRpcSimplified.delete,
    };

    const func: ActionFunction = async ({ request }) => {
      let response: RPCResponse;
      
      try {
        const res = await this.processTableControllerRequest(dataSource, request, tableRpc);
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
    
    func['rpcFunction'] = 'createTableRpc';
    
    return func;
  };

  private async processTableControllerRequest(dataSource: DataSource, request: Request, tableRpc: TableRpc): Promise<any> {
    const { isTokenValid, newRequest, invalidTokenErrorMessage } = await this.ensureValidToken(request);
    if (!isTokenValid) {
      throw new Error(`Invalid JWT token: ${invalidTokenErrorMessage}`);
    }

    const body = await newRequest.json() as RPCActionBody<'table_spec' | 'table_select' | 'table_selectOne' | 'table_insert' | 'table_update' | 'table_delete'>;
    const dataSourceAdapter = dataSource.adapter as DataSourceAdapter;

    try {
      if (body.action === 'table_spec') {
        // If the table is not specified, return the response without the table schema
        if (!tableRpc.table) {
          return {
            tableRpc,
          } as TableSpec;
        }

        // Get all linked table names
        // TODO: collect all linked tables recursively to support more than 2 levels of linked
        const linkedTableNames: string[] = [];
        Object.entries(tableRpc.linked ?? {}).forEach(([, linkedTable]) => {
          linkedTableNames.push(linkedTable.targetTable);

          Object.entries(linkedTable.linked ?? {}).forEach(([, linkedTable]) => {
            linkedTableNames.push(linkedTable.targetTable);
          });
        });

        const tableSchemas = await dataSourceAdapter.getTableSchemas([...new Set([tableRpc.table, ...(linkedTableNames ?? [])])]);
        const tableSchema = tableSchemas.find(schema => schema.name === tableRpc.table);
        const linkedTableSchemas = tableSchemas.filter(schema => linkedTableNames?.includes(schema.name));

        if (!tableSchema) {
          return new Response('Table does not exist in the database', { status: 404 });
        }
        
        return { 
          tableRpc,
          tableSchema,
          linkedTableSchemas, 
        } as TableSpec;
      } else if (body.action === 'table_select') {
        const result = await dataSourceAdapter.getTableRecords(tableRpc, body.input as TableRpcInputSelect);
        return result;
      } else if (body.action === 'table_selectOne') {
        const result = await dataSourceAdapter.getOneTableRecord(tableRpc, body.input as TableRpcInputSelectSingle);
        return result;
      } else if (body.action === 'table_insert') {
        const result = await dataSourceAdapter.insertTableRecord(tableRpc, body.input as TableRpcInputInsert);
        return result;
      } else if (body.action === 'table_update') {
        const result = await dataSourceAdapter.updateTableRecords(tableRpc, body.input as TableRpcInputUpdate);
        return result;
      } else if (body.action === 'table_delete') {
        const result = await dataSourceAdapter.deleteTableRecords(tableRpc, body.input as TableRpcInputDelete);
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

  private async ensureValidToken(request: Request): Promise<EnsureValidTokenResponse> {
    // If a custom token validation function is provided, use it
    if (this.customEnsureValidToken) {
      return this.customEnsureValidToken(request);
    }

    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      const cookieHeader = request.headers.get('Cookie');
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
  
      // Clone the request and set the user
      const newRequest = request.clone();
      newRequest.headers.set('x-user', JSON.stringify(user));
      
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
}

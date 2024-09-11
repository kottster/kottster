import { ExtendAppContextFunction } from '../models/appContext.model';
import { PROJECT_DIR } from '../constants/projectDir';
import { AppContext, checkTsUsage, DataSource, JWTTokenPayload, Stage, User } from '@kottster/common';
import { DataSourceRegistry } from './dataSourceRegistry';
import { ActionService } from '../services/action.service';
import { AnyRouter } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import * as jose from 'jose';

export interface KottsterAppOptions {
  appId: string;
  secretKey: string;
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

  public extendContext: ExtendAppContextFunction;

  constructor(options: KottsterAppOptions) {
    this.appId = options.appId;
    this.secretKey = options.secretKey;
    this.usingTsc = checkTsUsage(PROJECT_DIR);
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
   * Create a service route loader for the Remix app
   * @param appRouter The tRPC router
   * @returns The loader function
   */
  public createServiceRouteLoader<TRouter extends AnyRouter>(appRouter: TRouter) {
    const loader = async ({ request }: { request: Request }) => {
      const { pathname } = new URL(request.url);
    
      // Handle Kottster API requests
      if (pathname.startsWith('/-/kottster-api')) {
        return this.handleKottsterApiRequest(request);
      }

      // Handle tRPC requests
      if (pathname.startsWith('/-/trpc')) {
        const [isTokenValid, newRequest] = await this.ensureValidToken(request);
        if (!isTokenValid) {
          return new Response('Unauthorized', { status: 401 });
        }
        
        return fetchRequestHandler({
          endpoint: '/-/trpc',
          req: newRequest,
          router: appRouter,
          createContext: () => this.createContext(newRequest),
        });
      }
    }

    return loader;
  }

  /**
   * Get the Kottster API loader for Remix app
   * @returns The loader function
   * @throws Error if the token is invalid
   */
  public async handleKottsterApiRequest(request: Request) {
    if (request.method === 'OPTIONS') {
      return this.handleOptionsRequest(request);
    }

    // Ensure the token is valid
    const [isTokenValid, newRequest] = await this.ensureValidToken(request);
    if (!isTokenValid) {
      return new Response(`Invalid JWT token, please check your app's secret key or reload the page`, { status: 401 });
    }
    
    const { searchParams } = new URL(newRequest.url);
    const action = searchParams.get('action');
    const actionDataRaw = searchParams.get('actionData');
    const actionData = actionDataRaw ? JSON.parse(actionDataRaw) : {};

    if (!action) {
      throw new Error('Action not found in request');
    }

    return this.executeAction(action, actionData);
  }

  /**
   * Get the data from the token
   * @param token The JWT token
   * @returns The data from the token
   */
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

  /**
   * Ensure that the request has a valid token
   * @param request The request object
   * @throws Error if the token is invalid
   */
  public async ensureValidToken(request: Request): Promise<[boolean, Request]> {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('Invalid JWT token: token not passed');
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
   * Handle an OPTIONS request
   * @param _ The request object
   * @returns The response
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public handleOptionsRequest(_: Request) {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.KOTTSTER_CORS_ALLOW_ORIGIN ?? 'https://web.kottster.app',
        'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    })
  }

  /**
   * Create a context for a request
   * @param req The Next.js request object
   * @throws Error if user is not found or if there's an issue parsing user information
   */
  public createContext(req: Request): any {
    let user: User;
    
    // Get the user from the request header that was set by the middleware
    const userHeader = req.headers.get('x-user');
    if (!userHeader) {
      throw new Error('User not found in request headers');
    }

    try {
      user = JSON.parse(userHeader as string);
    } catch (error) {
      throw new Error('Failed to parse user information from header');
    }

    if (!user || !user.id) {
      throw new Error('Invalid user information in header');
    }

    const ctx: AppContext = {
      user: {
        id: user.id,
        email: user.email,
      },
      stage: this.stage
    };

    // Add the data sources to the context
    this.dataSources.forEach((dataSource) => {
      ctx[dataSource.ctxPropName] = dataSource.adapter.getClient();
    });

    return this.extendContext ? this.extendContext(ctx) : ctx;
  }

  /**
   * Get the registered data sources
   */
  public getDataSources() {
    return this.dataSources;
  }
}

import { ExtendAppContextFunction } from '../models/appContext.model';
import { PROJECT_DIR } from '../constants/projectDir';
import { AppContext, checkTsUsage, DataSource, Stage } from '@kottster/common';
import { DataSourceRegistry } from './dataSourceRegistry';
import { NextResponse } from 'next/server';
import { ActionService } from '../services/action.service';
import { AnyRouter } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

export interface KottsterAppOptions {
  appId: string;
  secretKey: string;
}

/**
 * The main app class
 */
export class KottsterApp {
  public readonly appId: string;
  public readonly usingTsc: boolean;
  public readonly stage: Stage = (process.env.NODE_ENV || 'production') as Stage;  
  public dataSources: DataSource[] = [];

  public extendContext: ExtendAppContextFunction;

  constructor(options: KottsterAppOptions) {
    this.appId = options.appId;
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
   * Get the root handler for the Next.js app
   * @param router The tRPC router
   * @returns The handler
   */
  getRootHandler<TRouter extends AnyRouter>(router: TRouter) {
    // tRPC handler
    const trpcHandler = (req: Request) =>
      fetchRequestHandler({
        endpoint: '/trpc',
        req,
        router,
        createContext: () => this.createContext(req),
      });

    const handler = async (request: Request) => {
      const { searchParams, pathname } = new URL(request.url);

      // Handle tRPC requests
      if (pathname.startsWith('/trpc')) {
        return trpcHandler(request);
      }

      // Handle Kottster API requests
      if (pathname.startsWith('/kottster-api')) {
        const action = searchParams.get('action');
        const actionDataRaw = searchParams.get('actionData');
        const actionData = actionDataRaw ? JSON.parse(actionDataRaw) : {};

        if (!action) {
          throw new Error('Action not found in request');
        }

        const res = await this.executeAction(action, actionData);
        return NextResponse.json(res);
      }

      // Return health check response
      return new NextResponse(`Kottster app is running in ${process.env.NODE_ENV} mode (id=${this.appId})`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    };

    return handler;
  }

  /**
   * Create a context for a request
   * @param req The Next.js request object
   * @throws Error if user is not found or if there's an issue parsing user information
   */
  public createContext(req: Request): AppContext {
    let user;
    
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

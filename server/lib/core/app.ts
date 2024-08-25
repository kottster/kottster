import routes from '../routes';
import cors from 'cors';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import express, { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';
import { ExtendAppContextFunction } from '../models/appContext.model';
import { PROJECT_DIR } from '../constants/projectDir';
import { AppContext, checkTsUsage, DataSource, getEnvOrThrow, JWTTokenPayload, ProcedureFunction, RegisteredProcedure, Role, Stage, User } from '@kottster/common';
import { FileReader } from '../services/fileReader.service';
import http from 'http';
import WebSocket from 'ws';
import * as trpcExpress from '@trpc/server/adapters/express';
import { DataSourceRegistry } from './dataSourceRegistry';

export interface KottsterAppOptions {
  appId: string;
  secretKey: string;
}

/**
 * The main app class
 */
export class KottsterApp {
  public version: number;
  public readonly appId: string;
  public readonly usingTsc: boolean;

  private readonly secretKey: string;
  public readonly stage: Stage = (process.env.NODE_ENV || 'production') as Stage;

  private readonly expressApp = express();
  private server: http.Server;
  private wss: WebSocket.Server;
  private readonly jwtSecret = getEnvOrThrow('JWT_SECRET');
  
  private procedures: RegisteredProcedure[] = [];
  public dataSources: DataSource[] = [];

  public extendContext: ExtendAppContextFunction;

  constructor(options: KottsterAppOptions) {
    this.appId = options.appId;
    this.secretKey = options.secretKey;
    this.usingTsc = checkTsUsage(PROJECT_DIR);

    this.loadDataFromSchema();
    this.setupExpressMiddleware();
    this.setupExpressRoutes();
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
   * Create a context for a request
   * @param req The Express request object
   */
  public createContext(req: Request): AppContext {
    const ctx: AppContext = {
      user: {
        id: req.user.id,
        email: req.user.email,
      },
      stage: this.stage
    };

    // Add the data sources to the context
    this.dataSources.forEach((dataSource) => {
      ctx[dataSource.contextPropName] = dataSource.adapter.getClient();
    });

    return this.extendContext ? this.extendContext(ctx) : ctx;
  }

  /**
   * Get the registered procedures
   */
  public getProcedures() {
    return this.procedures;
  }  

  /**
   * Get the registered data sources
   */
  public getDataSources() {
    return this.dataSources;
  }

  /**
   * Set the tRPC router
   * @param router The tRPC router
   */
  public setTRPCRouter(router: any) {
    this.expressApp.use('/trpc', this.getAuthExpressMiddleware(), trpcExpress.createExpressMiddleware({
      router,
      createContext: ({ req }) => this.createContext(req)
    }));
  }

  /**
   * Register procedures
   * @param procedures The procedures to register
   */
  public registerProcedures(procedures: Record<string, ProcedureFunction>): void {
    Object.entries(procedures).forEach(([procedureName, procedureFunction]) => {
      // Add the procedure
      this.procedures.push({
        procedureName,
        function: procedureFunction
      });
    });
  }

  /**
   * Register a procedure for a specific component
   * @param procedureName The name of the procedure
   * @param fn The function to execute when the procedure is called
   */
  public registerProcedure(
    procedureName: string,
    procedureFunction: ProcedureFunction
  ): void {
    this.procedures.push({
      procedureName,
      function: procedureFunction
    });
  }

  /**
   * Get the Express middleware for authenticating requests
   * @param requiredRole The required role for the request
   */
  private getAuthExpressMiddleware = (requiredRole?: Role) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.split(' ')[1];
  
      if (!this.jwtSecret) {
        return res.status(500).json({ error: 'JWT secret not set' })
      }

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
  
      try {
        const decodedToken = (this.stage === 'development' ? jwt.decode(token) : jwt.verify(token, this.jwtSecret)) as JWTTokenPayload;
        
        if (String(decodedToken.appId) !== String(this.appId)) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        if (requiredRole && decodedToken.role !== requiredRole) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Set the user on the request object
        req.user = {
          id: decodedToken.id,
          email: decodedToken.email
        } as User;
  
        next();
      } catch (error) {
        console.log('Error verifying token', token, error);
        return res.status(401).json({ error: 'Invalid token' });
      }
    };
  }

  /**
   * Load the app schema from the schema.json file
   * @returns The app schema
   */
  private loadDataFromSchema(): void {
    const fileReader = new FileReader();
    const appSchema = fileReader.readSchemaJson();

    this.version = appSchema.version;
  }

  /**
   * Setup the Express middleware
   */
  private setupExpressMiddleware(): void {
    this.expressApp.use(express.urlencoded({ extended: true, limit: '100kb' }));
    this.expressApp.use(cors());
    this.expressApp.use('/static', express.static(`${PROJECT_DIR}/dist/static`));
    this.expressApp.use(express.json());
    this.expressApp.use(express.urlencoded({ extended: true }));
  }

  /**
   * Setup the Express routes
   */
  private setupExpressRoutes(): void {
    this.expressApp.get('/', routes.healthcheck(this));
    this.expressApp.get('/action/:action', this.getAuthExpressMiddleware(), routes.executeAction(this));
  }

  /**
   * Connect to the data sources
   */
  public connectToDataSources(): void {
    this.dataSources.forEach((dataSource) => {
      dataSource.adapter.connect();

      // Ping the database to check if the connection is successful
      dataSource.adapter.pingDatabase();
    });
  }

  private createServer(): void {
    this.server = http.createServer({
      maxHeaderSize: 102400 // 100KB
    }, this.expressApp);
  }

  private createWebSocketServer(): void {
    this.wss = new WebSocket.Server({ server: this.server });

    // When nodemon restarts the server, send a message to the client to reload
    process.once('SIGUSR2', () => {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('reload');
        }
      });
      process.kill(process.pid, 'SIGUSR2');
    });
  }

  /**
   * Start the Express server
   * @returns The server instance
   */
  public start(port: number | string): Server {
    if (typeof port === 'string') {
      port = Number(port);
    }

    this.connectToDataSources();
    this.createServer();
    this.createWebSocketServer();

    return this.server.listen(port, () => {
      console.log(`Stage: ${chalk.green(process.env.NODE_ENV)}`);
      console.log(`Server URL: ${chalk.green(`http://localhost:${port}`)}`);
    });
  }
}

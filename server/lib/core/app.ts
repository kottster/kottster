import routes from '../routes';
import cors from 'cors';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import express, { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';
import { Role } from '../models/role.model';
import { AppContext, ExtendAppContextFunction } from '../models/appContext.model';
import { PROJECT_DIR } from '../constants/projectDir';
import { DataSource, getEnvOrThrow, RegisteredProcedure, Stage } from '@kottster/common';
import { FileReader } from '../services/fileReader.service';
import { DataSourceManager } from '../services/dataSourceManager.service';

export interface KottsterAppOptions {
  appId: string;
  secretKey: string;
  stage: Stage;
}

/**
 * The main app class
 */
export class KottsterApp {
  public version: number;
  public readonly appId: string;
  public readonly stage: Stage;

  private readonly expressApp = express();
  private readonly jwtSecret = getEnvOrThrow('JWT_SECRET');
  
  private procedures: RegisteredProcedure[] = [];
  public dataSources: DataSource[] = [];

  public extendContext: ExtendAppContextFunction;

  constructor(options: KottsterAppOptions) {
    this.appId = options.appId;
    this.stage = options.stage;

    this.loadDataFromSchema();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Register data sources
   * @param dataSources The data sources to register
   */
  public registerDataSources(dataSources: DataSource[]) {
    this.dataSources = dataSources;
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
  public createContext(): AppContext {
    const ctx: AppContext = {};

    // Add the data sources to the context
    this.dataSources.forEach((dataSource) => {
      ctx[dataSource.contextPropName] = dataSource.client;
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
   * Register procedures
   * @param procedures The procedures to register
   */
  public registerProcedures(procedures: Record<string, RegisteredProcedure['function']>): void {
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
    procedureFunction: RegisteredProcedure['function']
  ): void {
    this.procedures.push({
      procedureName,
      function: procedureFunction
    });
  }

  private getAuthMiddleware = (requiredRole?: Role) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.split(' ')[1];
  
      if (!this.jwtSecret) {
        return res.status(500).json({ error: 'JWT secret not set' })
      }

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
  
      try {
        const decodedToken = jwt.verify(token, this.jwtSecret) as { appId: string; role: Role };
        if (String(decodedToken.appId) !== String(this.appId)) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        if (requiredRole && decodedToken.role !== requiredRole) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
  
        next();
      } catch (error) {
        console.debug('Error verifying token', token, error);
        return res.status(401).json({ error: 'Invalid token' });
      }
    };
  }

  private loadDataFromSchema(): void {
    const fileReader = new FileReader();
    const appSchema = fileReader.readSchemaJson();

    this.version = appSchema.version;
  }

  private setupMiddleware(): void {
    this.expressApp.use(cors());
    this.expressApp.use('/static', express.static(`${PROJECT_DIR}/dist/static`));
    this.expressApp.use(express.json());
    this.expressApp.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    this.expressApp.get('/', routes.healthcheck(this));
    this.expressApp.get('/start-time', routes.getServerStartTime());
    this.expressApp.get('/action/:action', this.getAuthMiddleware(Role.DEVELOPER), routes.executeAction(this));
    this.expressApp.get('/rpc/:procedureName', this.getAuthMiddleware(), routes.executeProcedure(this));
  }

  /**
   * Connect to the data sources
   */
  public connectToDataSources(): void {
    this.dataSources.forEach((dataSource) => {
      const client = DataSourceManager.getClient(dataSource);
      client.connect();

      // Ping the database to check if the connection is successful
      client.pingDatabase();
    });
  }

  /**
   * Start the Express server
   * @returns The server instance
   */
  public start(port: number): Server {
    this.connectToDataSources();

    return this.expressApp.listen(port, () => {
      console.log(`Kottster backend is running on port ${port}`);
      console.log(`Stage: ${chalk.green(process.env.NODE_ENV)}`);
      console.log(`Server URL: ${chalk.green(`http://localhost:${port}`)}`);
    });
  }
}

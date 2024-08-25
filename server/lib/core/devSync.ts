import cors from 'cors';
import { Server, createServer } from 'http';
import express from 'express';
import routes from '../routes';
import { checkTsUsage } from '@kottster/common';
import { PROJECT_DIR } from '../constants/projectDir';

export interface DevSyncOptions {
  appId: string;
}

/**
 * The development sync class 
 */
export class DevSync {
  public readonly appId: string;
  private readonly expressApp = express();
  private readonly server: Server;
  public readonly usingTsc: boolean;

  constructor(options: DevSyncOptions) {
    this.appId = options.appId;
    this.usingTsc = checkTsUsage(PROJECT_DIR);

    // Create a server with increased header size limit
    this.server = createServer({
      maxHeaderSize: 32 * 1024 // 32KB
    }, this.expressApp);

    this.setupExpressMiddleware();
    this.setupExpressRoutes();
  }

  /**
   * Setup the Express middleware
   */
  private setupExpressMiddleware(): void {
    this.expressApp.use(express.json({ limit: '1mb' }));
    this.expressApp.use(express.urlencoded({ extended: true, limit: '1mb' }));
    this.expressApp.use(cors());
  }

  /**
   * Setup the Express routes
   */
  private setupExpressRoutes(): void {
    this.expressApp.get('/action/:action', routes.executeDSAction(this));
  }

  /**
   * Start the Express server
   * @returns The server instance
   */
  public start(port: number | string): Server {
    if (typeof port === 'string') {
      port = Number(port);
    }

    return this.server.listen(port, () => {
      console.log(`Dev-sync server is running on port ${port}`);
    });
  }
}
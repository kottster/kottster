import { KottsterApp } from "../core/app";
import { DataSource, Stage } from "@kottster/common";
import express from 'express';
import path from 'path';
import fs from 'fs';
import { PROJECT_DIR } from "../constants/projectDir";
import { commonHeaders } from "../constants/commonHeaders";
import chalk from "chalk";
import { Server } from "http";
import { DataSourceRegistry } from "./dataSourceRegistry";
import { FileReader } from "../services/fileReader.service";
import { createDataSource } from "../factories/createDataSource";
import { WebSocketServer } from 'ws';

interface KottsterServerOptions {
  app: KottsterApp;
}

export class KottsterServer {
  private app: KottsterApp;
  private port: number;
  private expressApp: express.Application;
  private server: Server;
  private wss: WebSocketServer;

  constructor({ 
    app, 
  }: KottsterServerOptions) {
    const isDevelopment = app.stage === Stage.development;
    const serverPort = isDevelopment ? process.env.DEV_API_SERVER_PORT : process.env.PORT;

    if (isDevelopment && !serverPort) {
      throw new Error("DEV_API_SERVER_PORT environment variable is required in development mode.");
    }
    
    this.app = app;
    this.port = serverPort ? +serverPort : 3000;
    this.expressApp = express();
  }

  private setupMiddleware() {
    this.expressApp.use(express.json());
    this.expressApp.use(express.urlencoded({ extended: true }));
    this.expressApp.use((req, res, next) => {
      Object.entries(commonHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      // Handle CORS preflight requests
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
      
      next();
    });
  }

  private setupServiceRoutes() {
    this.expressApp.use('/internal-api', this.app.getInternalApiRoute());
  }

  private setupWebSocketHealthCheck() {
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/ws-health' 
    });

    this.wss.on('connection', (ws) => {
      const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.send('ping');
        }
      }, 30000);
      
      ws.on('close', () => {
        clearInterval(pingInterval);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clearInterval(pingInterval);
      });
    });
  }

  private async setupDynamicDataSources() {
    const isDevelopment = this.app.stage === Stage.development;
    const fileReader = new FileReader(isDevelopment);

    // Dynamically load data sources from the data-sources directory
    const dataSourcesDir = isDevelopment ? `${PROJECT_DIR}/app/_server/data-sources` : `${PROJECT_DIR}/dist/server/data-sources`;
    
    try {
      if (!fs.existsSync(dataSourcesDir)) {
        return;
      }
      const dataSources: DataSource[] = [];
      const dataSourceConfigs = fileReader.getDataSourceConfigs();

      if (dataSourceConfigs) {
        for (const dataSourceConfig of dataSourceConfigs) {
          const dataSourcePath = path.join(dataSourcesDir, dataSourceConfig.name, isDevelopment ? `index.${this.app.usingTsc ? 'ts' : 'js'}` : 'index.cjs');

          if (fs.existsSync(dataSourcePath)) {
            try {
              const dataSourceModule = await import(dataSourcePath);
              if (dataSourceModule.default && typeof dataSourceModule.default === 'object') {
                const dataSource = createDataSource({
                  type: dataSourceConfig.type,
                  name: dataSourceConfig.name,
                  tablesConfig: dataSourceConfig.tablesConfig || {},
                  init: () => {
                    return dataSourceModule.default;
                  }
                });

                dataSources.push(dataSource);
              }
            } catch (error) {
              console.error(`Failed to load data source "${dataSourceConfig.name}":`, error);
            }
          } else {
            console.warn(`Data source file not found for "${dataSourceConfig.name}" at "${dataSourcePath}"`);
          }
        }
      }

      const dataSourceRegistry = new DataSourceRegistry(dataSources);
      this.app.loadFromDataSourceRegistry(dataSourceRegistry);
    } catch (error) {
      console.error('Error reading data sources directory:', error);
    }
  }

  private async setupDynamicRoutes() {
    const isDevelopment = this.app.stage === Stage.development;
    const loadedPageConfigs = this.app.loadPageConfigs();

    if (loadedPageConfigs) {
      for (const pageConfig of loadedPageConfigs) {
        try {
          const pagesDir = isDevelopment ? `${PROJECT_DIR}/app/pages` : `${PROJECT_DIR}/dist/server/pages`;
          const usingTsc = this.app.usingTsc;
          const apiPath = path.join(pagesDir, pageConfig.key, isDevelopment ? `api.server.${usingTsc ? 'ts' : 'js'}` : 'api.cjs');
  
          // If the page is custom or has a defined api.server.js file, load it
          if (pageConfig.type === 'custom' || fs.existsSync(apiPath)) {
            try {
              const routeModule = await import(apiPath);
              if (routeModule.default && typeof routeModule.default === 'function') {
                const routePath = `/api/${pageConfig.key}`;
  
                this.expressApp.post(routePath, this.app.createRequestWithPageDataMiddleware(pageConfig), routeModule.default);
              }
            } catch (error) {
              console.error(`Failed to load route "${pageConfig.key}":`, error);
            }
          } else {
            if (pageConfig.type === 'table') {
              if (!pageConfig.config.dataSource) {
                console.warn(`Page "${pageConfig.key}" does not have a data source specified. Skipping route setup.`);
                continue;
              }
  
              this.expressApp.post(`/api/${pageConfig.key}`, this.app.createRequestWithPageDataMiddleware(pageConfig), this.app.defineTableController({}));
            }
            if (pageConfig.type === 'dashboard') {
              this.expressApp.post(`/api/${pageConfig.key}`, this.app.createRequestWithPageDataMiddleware(pageConfig), this.app.defineDashboardController(pageConfig.config));
            }
          }
        } catch (error) {
          console.error(`Error setting up route for page "${pageConfig.key}":`, error);
        }
      };
    }
  }

  private setupStaticFiles() {
    if (this.app.stage === Stage.development) {
      return;
    }

    const clientDir = path.join(PROJECT_DIR, 'dist', 'client');
    if (fs.existsSync(clientDir)) {
      this.expressApp.use(express.static(clientDir));
      
      // Matching all GET requests
      this.expressApp.get('/{*splat}', (req, res) => {
        const indexPath = path.join(clientDir, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Index file not found');
        }
      });
    } else {
      console.warn(`Client directory not found: ${clientDir}`);
    }
  }

  public checkDistDirectoryExists() {
    if (this.app.stage !== Stage.production) {
      return;
    }

    const distDir = path.join(PROJECT_DIR, 'dist');
    if (!fs.existsSync(distDir)) {
      throw new Error(`The 'dist' directory does not exist. Please run the ${chalk.bold('build')} command to generate it.`);
    }
  }

  public async start() {
    this.checkDistDirectoryExists();
    this.setupMiddleware();
    this.setupServiceRoutes();
    await this.setupDynamicDataSources();
    await this.setupDynamicRoutes();
    this.setupStaticFiles();
    
    // Initialize the app
    await this.app.initialize();

    this.server = this.expressApp.listen(this.port, () => {
      if (this.app.stage === Stage.production) {
        // Show server info on startup
        console.info(`Server is running on ${chalk.bold(`http://localhost:${this.port}`)} in production mode`);
      }

      // Setup websocket health check if in development mode
      if (this.app.stage === Stage.development) {
        this.setupWebSocketHealthCheck();
      }
    });
  }

  public async stop() {
    if (this.server) {
      this.server.close(() => {
        console.info(`API server on port ${this.port} has been stopped.`);
      });
    }
  }
}
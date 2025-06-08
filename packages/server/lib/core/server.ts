import { KottsterApp } from "../core/app";
import { Stage } from "@kottster/common";
import express from 'express';
import path from 'path';
import fs from 'fs';
import { PROJECT_DIR } from "../constants/projectDir";
import { commonHeaders } from "../constants/commonHeaders";
import chalk from "chalk";
import { Server } from "http";

interface KottsterServerOptions {
  app: KottsterApp;
}

export class KottsterServer {
  private app: KottsterApp;
  private port: number;
  private expressApp: express.Application;
  private server: Server;

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
    this.expressApp.use('/internal-api/', this.app.getInternalApiRoute());
    this.expressApp.use('/devsync-api/', this.app.getDevSyncApiRoute());
  }

  private async setupDynamicRoutes() {
    const isDevelopment = this.app.stage === Stage.development;
    const pagesDir = isDevelopment ? `${PROJECT_DIR}/app/pages` : `${PROJECT_DIR}/dist/server/pages`;
    
    try {
      if (!fs.existsSync(pagesDir)) {
        return;
      }
  
      const routeDirs = fs.readdirSync(pagesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
  
      for (const routeDir of routeDirs) {
        const usingTsc = this.app.usingTsc;
        const apiPath = path.join(pagesDir, routeDir, isDevelopment ? `api.server.${usingTsc ? 'ts' : 'js'}` : 'api.cjs');
        
        if (fs.existsSync(apiPath)) {
          try {
            const routeModule = await import(apiPath);
            if (routeModule.default && typeof routeModule.default === 'function') {
              const routePath = `/api/${routeDir}`;
              this.expressApp.post(routePath, routeModule.default);
            }
          } catch (error) {
            console.error(`Failed to load route ${routeDir}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error reading pages directory:', error);
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
      throw new Error(`Client directory not found: ${clientDir}`);
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
    await this.setupDynamicRoutes();
    this.setupStaticFiles();

    this.server = this.expressApp.listen(this.port, () => {
      if (this.app.stage === Stage.production) {
        // Show server info on startup
        console.info(`Server is running on ${chalk.bold(`http://localhost:${this.port}`)} in production mode`);
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
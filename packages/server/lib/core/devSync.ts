import { IncomingMessage, ServerResponse, Server, createServer } from 'http';
import { parse as parseUrl } from 'url';
import { parse as parseQueryString } from 'querystring';
import { checkTsUsage } from '@kottster/common';
import { PROJECT_DIR } from '../constants/projectDir';
import { ActionService } from '../services/action.service';

export interface DevSyncOptions {
  appId: string;
}

/**
 * The dev sync class 
 * @description Allow Kottster to make changes to the app schema and files
 */
export class DevSync {
  public readonly appId: string;
  private readonly server: Server;
  public readonly usingTsc: boolean;

  constructor(options: DevSyncOptions) {
    this.appId = options.appId;
    this.usingTsc = checkTsUsage(PROJECT_DIR);

    // Create a server with increased header size limit
    this.server = createServer({
      maxHeaderSize: 32 * 1024 // 32KB
    }, this.handleRequest.bind(this));
  }

  /**
   * Handle incoming requests
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const { pathname } = parseUrl(req.url || '');

    if (pathname?.startsWith('/action/')) {
      this.handleActionRequest(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  }

  private handleActionRequest(req: IncomingMessage, res: ServerResponse) {
    const { pathname, query } = parseUrl(req.url || '');
    const action = pathname?.split('/')[2];

    if (!action) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Action not found in request' }));
      return;
    }
      
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      // Parse the action data
      let actionData = {};
      if (req.headers['content-type'] === 'application/json') {
        try {
          actionData = JSON.parse(body);
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
      } else if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        actionData = parseQueryString(body);
      } else if (query) {
        const parsedQuery = parseQueryString(query);
        if (parsedQuery.actionData) {
          try {
            actionData = JSON.parse(parsedQuery.actionData as string);
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid actionData JSON' }));
            return;
          }
        }
      }

      try {
        const result = await ActionService.getDSAction(this, action).execute(actionData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  }

  /**
   * Start the server
   * @returns The server instance
   */
  public start(port: number | string): Server {
    if (typeof port === 'string') {
      port = Number(port);
    }

    return this.server.listen(port, () => {
      console.log(`Dev-sync is running on port ${port}`);

      console.log(`Starting the server in development mode...`);
    });
  }
}
import { ChildProcess } from 'child_process';
import spawn from 'cross-spawn';
import { HttpFreePortFinder } from '../services/httpFreePortFinder.service';
import { checkTsUsage } from '@kottster/common';
import chalk from 'chalk';

interface Options {
  debug?: boolean;
}

/**
 * Start the project in development mode.
 */
export async function startProjectDev(options: Options): Promise<void> {
  const usingTsc = checkTsUsage();

  // Look for a free port for the API server
  const httpFreePortFinder = new HttpFreePortFinder(5481, 6500);
  const serverPort = await httpFreePortFinder.findFreePort();
  const serverPortStr = serverPort.toString();
  const serverUrl = `http://localhost:${serverPort}`;

  let serverProcess: ChildProcess | null = null;
  let viteProcess: ChildProcess | null = null;

  function startServer(restarted: boolean = false) {
    const serverEnv = { 
      ...process.env,

      NODE_ENV: 'development',
      
      SERVER_PORT: serverPortStr,
      VITE_SERVER_PORT: serverPortStr,

      SERVER_RESTARTED: restarted ? 'true' : undefined,
      
      SERVER_URL: serverUrl,
      VITE_SERVER_URL: serverUrl,
      
      DEBUG_MODE: options.debug ? 'true' : undefined,
      
      // Disabling CJS warnings for Vite (https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated)
      VITE_CJS_IGNORE_WARNING: 'true',
    };

    // Set the environment variables for the current process
    process.env = { ...process.env, ...serverEnv };

    // Kill the existing server
    if (serverProcess) {
      serverProcess.removeAllListeners();
      serverProcess.kill();
      serverProcess = null;
    }

    // Create a new Vite process if it doesn't exist
    if (!viteProcess) {
      viteProcess = spawn('vite', ['dev'], {
        stdio: 'inherit',
        env: serverEnv,
      });
      viteProcess.on('error', (error) => {
        console.error(`${chalk.red('Server error:')}`, error);
      });
    }
    
    // Start the server process
    serverProcess = spawn(
      'tsx',
      [
        'watch',
        '--clear-screen=false',
        '--include', './app/_server/**/*.ts',
        '--include', './app/_server/**/*.js',
        '--include', './app/pages/**/api.server.ts',
        '--include', './app/pages/**/api.server.js',
        usingTsc ? './app/_server/server.ts' : './app/_server/server.js'
      ],
      {
        stdio: 'inherit',
        env: serverEnv,
      }
    );
    serverProcess.on('error', (error) => {
      console.error(`${chalk.red('Server error:')}`, error);
    });
  };

  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    if (serverProcess) {
      serverProcess.kill();
    }
    if (viteProcess) {
      viteProcess.kill();
    }
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    if (serverProcess) {
      serverProcess.kill();
    }
    if (viteProcess) {
      viteProcess.kill();
    }
    process.exit(0);
  });

  startServer();
}
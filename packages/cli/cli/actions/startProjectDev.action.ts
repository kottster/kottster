import { ChildProcess } from 'child_process';
import spawn from 'cross-spawn';
import { checkTsUsage } from '@kottster/common';
import chalk from 'chalk';
import fs from 'fs';
import portfinder from 'portfinder';

interface Options {
  debug?: boolean;
}

/**
 * Start the project in development mode.
 */
export async function startProjectDev(options: Options): Promise<void> {
  const usingTsc = checkTsUsage();

  // Look for a free port for the API server
  let devApiServerPort: number;
  if (process.env.DEV_API_SERVER_PORT) {
    devApiServerPort = +process.env.DEV_API_SERVER_PORT;
    if (isNaN(devApiServerPort) || devApiServerPort < 1 || devApiServerPort > 65535) {
      throw new Error(`Invalid DEV_API_SERVER_PORT: ${process.env.DEV_API_SERVER_PORT}`);
    }
  } else {
    // If DEV_API_SERVER_PORT is not set, find a free port in the range 5481-6500
    devApiServerPort = await portfinder.getPortPromise({
      port: 5481,
      stopPort: 6500,
    });
  }
  const devApiServerPortStr = devApiServerPort.toString();
  const devApiServerUrl = `http://localhost:${devApiServerPort}`;

  // Remove .cache directory if it exists
  const cacheDir = './.cache';
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
  };

  let serverProcess: ChildProcess | null = null;
  let viteProcess: ChildProcess | null = null;

  function startServer() {
    const serverEnv = { 
      ...process.env,

      // Set NODE_ENV=development just in case
      NODE_ENV: 'development',

      // Kottster app uses it's environment variable to determine the stage,
      KOTTSTER_APP_STAGE: 'development',
      VITE_KOTTSTER_APP_STAGE: 'development',

      VITE_PROJECT_DIR: process.cwd(),
      
      DEV_API_SERVER_PORT: devApiServerPortStr,
      VITE_DEV_API_SERVER_PORT: devApiServerPortStr,
      
      DEV_API_SERVER_URL: devApiServerUrl,
      VITE_DEV_API_SERVER_URL: devApiServerUrl,

      CACHE_KEY: `${Date.now()}${process.pid.toString()}`,
      
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
        '--include', './app/**/*.json',
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
    serverProcess.on('spawn', () => {
      // Show server info on startup
      console.info(`  ${chalk.green('➜')}  ${chalk.bold('API server')} is running on port ${chalk.bold(serverEnv.DEV_API_SERVER_PORT)}`);
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
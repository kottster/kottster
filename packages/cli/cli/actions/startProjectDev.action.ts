import { execSync } from 'child_process';
import { DevSyncRunner } from '../services/devSyncRunner.service';

interface Options {
  debug?: boolean;
}

/**
 * Start the project in the current directory.
 */
export async function startProjectDev (options: Options): Promise<void> {
  // Environment variables
  const env = {
    ...process.env,
    NODE_ENV: 'development',
  };

  // Run dev-sync server
  const dsRunner = new DevSyncRunner(env);
  const [devSyncPort,] = await dsRunner.run();
  const devSyncServerUrl = `http://localhost:${devSyncPort}`;

  // Replace the "kottster dev" with "remix vite:dev"
  const args = process.argv.slice(3).filter(arg => arg !== '--debug');
  const command = ['remix', 'vite:dev', ...args].join(' ');

  // Run Remix server
  execSync(command, { 
    stdio: 'inherit',
    env: {
      ...process.env,
      DEV_SYNC_SERVER_URL: devSyncServerUrl,
      VITE_DEV_SYNC_SERVER_URL: devSyncServerUrl,
      DEBUG_MODE: options.debug ? 'true' : undefined,
      // Disabling CJS warnings for Vite (https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated)
      VITE_CJS_IGNORE_WARNING: 'true',
    },
  });
}

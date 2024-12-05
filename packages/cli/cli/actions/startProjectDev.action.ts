import { execSync } from 'child_process';
import { DevSyncRunner } from '../services/devSyncRunner.service';

/**
 * Start the project in the current directory.
 */
export async function startProjectDev (): Promise<void> {
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
  const args = process.argv.slice(3);
  const command = ['remix', 'vite:dev', ...args].join(' ');

  // Run Next.js server
  execSync(command, { 
    stdio: 'inherit',
    env: {
      ...process.env,
      DEV_SYNC_SERVER_URL: devSyncServerUrl,
      VITE_DEV_SYNC_SERVER_URL: devSyncServerUrl,
    },
  });
}

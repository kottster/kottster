import { AutoImport } from '@kottster/common';
import { execSync } from 'child_process';
import { DevSyncRunner } from '../services/devSyncRunner.service';
import { FileWatcher } from '../services/fileWatcher.service';

/**
 * Start the project in the current directory.
 */
export async function startProjectDev (): Promise<void> {
  // Environment variables
  const env = {
    ...process.env,
    NODE_ENV: 'development',
  };

  // Generate files
  const autoImport = new AutoImport({ usingTsc: true });
  autoImport.createPageRoutersFile();

  // Run dev-sync server
  const dsRunner = new DevSyncRunner(env);
  const [devSyncPort,] = await dsRunner.run();
  const devSyncServerUrl = `http://localhost:${devSyncPort}`;

  // Run nodemon
  const fileWatcher = new FileWatcher(env);
  await fileWatcher.run();

  // Run Next.js server
  execSync('npx next dev', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      DEV_SYNC_SERVER_URL: devSyncServerUrl,
    },
  });
}

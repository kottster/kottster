import { AutoImport } from '@kottster/common';
import { spawnSync } from 'child_process';
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
  const [devSyncPort, dsProcess] = await dsRunner.run();
  const devSyncServerUrl = `http://localhost:${devSyncPort}`;

  // Run nodemon
  const fileWatcher = new FileWatcher(env);
  const fwProcess = await fileWatcher.run();

  // Shutdown processes
  async function shutdown() {
    dsProcess.kill();
    fwProcess.kill();
  
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Run dev server
  spawnSync('npx', [
    'next',
    'dev'
  ], { 
    stdio: 'inherit',
    env: {
      ...env,
      DEV_SYNC_SERVER_URL: devSyncServerUrl,
    }
  });
}

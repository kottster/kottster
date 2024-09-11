import { ChildProcess, spawn } from 'child_process';
import { stripIndent } from '@kottster/common';
import * as path from 'path';

/**
 * Service to run file watcher
 */
export class FileWatcher {
  constructor(
    private readonly env: Record<string, string>,
    private readonly watchPath: string = path.join('app', 'routes')
  ) {}

  /**
   * Run file watcher
   * @returns The file watcher process
   */
  public async run(): Promise<ChildProcess> {
    const process = spawn('node', [
      '--no-warnings',
      '--input-type=module',
      '-e',
      this.getExecutableCode()
    ], { 
      stdio: 'inherit',
      env: {
        ...this.env,
        WATCH_PATH: this.watchPath
      }
    });

    process.on('error', (error) => {
      console.error('File watcher process error:', error);
    });

    return process;
  }

  private getExecutableCode(): string {
    return stripIndent(`
      import * as fs from 'fs';
      import * as path from 'path';
      import { AutoImport } from '@kottster/common';

      const watchPath = process.env.WATCH_PATH;
      const autoImport = new AutoImport({ usingTsc: true });

      const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (filename) {
          if (filename.endsWith('api.server.ts') || filename.endsWith('api.server.js')) {
            autoImport.createPageRoutersFile();
          }
        }
      });

      watcher.on('error', (error) => {
        console.error('File watcher error:', error);
      });

      process.on('SIGINT', () => {
        watcher.close();
        process.exit(0);
      });

      console.log('File watcher is running');
    `);
  }
}